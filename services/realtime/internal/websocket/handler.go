package websocket

import (
	"context"
	"net/http"
	"time"

	"github.com/coder/websocket"

	"github.com/examidentity/realtime/internal/pubsub"
	"github.com/examidentity/realtime/internal/session"
)

// Handler serves realtime exam-session connections. Each connection joins a
// per-session pub/sub channel: messages the client sends are published to the
// channel, and messages published by others (e.g. proctor monitors or the
// scoring pipeline) are streamed back to the client.
type Handler struct {
	sessions *session.SessionManager
	broker   pubsub.Broker
}

// NewHandler wires the session manager and pub/sub broker into the handler.
func NewHandler(sm *session.SessionManager, broker pubsub.Broker) *Handler {
	return &Handler{sessions: sm, broker: broker}
}

// ServeHTTP upgrades the request to a WebSocket bound to ?session=<id>.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session")
	if sessionID == "" {
		http.Error(w, "missing 'session' query parameter", http.StatusBadRequest)
		return
	}

	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		// MVP: accept any origin. Restrict to the web app origin in production.
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		return
	}
	defer c.Close(websocket.StatusNormalClosure, "bye")

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	channel := "session:" + sessionID
	sub := h.broker.Subscribe(channel)

	// Fan broker messages out to this client.
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-sub:
				wctx, wcancel := context.WithTimeout(ctx, 5*time.Second)
				err := c.Write(wctx, websocket.MessageText, []byte(msg.Payload))
				wcancel()
				if err != nil {
					cancel()
					return
				}
			}
		}
	}()

	// Read client messages (behavioural events) and publish to the channel.
	for {
		_, data, err := c.Read(ctx)
		if err != nil {
			return
		}
		_ = h.broker.Publish(ctx, channel, string(data))
	}
}
