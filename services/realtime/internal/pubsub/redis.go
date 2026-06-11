package pubsub

import (
	"context"
	"sync"
)

// Message is a single pub/sub message delivered to subscribers of a channel.
type Message struct {
	Channel string
	Payload string
}

// Broker is the pub/sub abstraction used by the realtime service to fan
// behavioural events out to connected clients. The MVP uses an in-process
// implementation; swap in a Redis-backed broker later without changing callers.
type Broker interface {
	Publish(ctx context.Context, channel, payload string) error
	Subscribe(channel string) <-chan Message
}

// InMemoryBroker is a simple, dependency-free, in-process pub/sub broker.
type InMemoryBroker struct {
	mu   sync.RWMutex
	subs map[string][]chan Message
}

// NewInMemoryBroker creates an empty in-memory broker.
func NewInMemoryBroker() *InMemoryBroker {
	return &InMemoryBroker{subs: make(map[string][]chan Message)}
}

// Subscribe registers a new subscriber for a channel and returns its receive
// channel. The returned channel is buffered; slow consumers may miss messages.
func (b *InMemoryBroker) Subscribe(channel string) <-chan Message {
	b.mu.Lock()
	defer b.mu.Unlock()
	ch := make(chan Message, 16)
	b.subs[channel] = append(b.subs[channel], ch)
	return ch
}

// Publish delivers a payload to every subscriber of the channel. Delivery is
// non-blocking: if a subscriber's buffer is full the message is dropped for
// that subscriber rather than stalling the whole fan-out.
func (b *InMemoryBroker) Publish(ctx context.Context, channel, payload string) error {
	b.mu.RLock()
	defer b.mu.RUnlock()
	msg := Message{Channel: channel, Payload: payload}
	for _, ch := range b.subs[channel] {
		select {
		case ch <- msg:
		case <-ctx.Done():
			return ctx.Err()
		default:
			// subscriber buffer full — drop to keep fan-out non-blocking
		}
	}
	return nil
}

// Ensure InMemoryBroker satisfies the Broker interface at compile time.
var _ Broker = (*InMemoryBroker)(nil)
