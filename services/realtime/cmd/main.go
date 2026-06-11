package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/examidentity/realtime/internal/pubsub"
	"github.com/examidentity/realtime/internal/session"
	ws "github.com/examidentity/realtime/internal/websocket"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	broker := pubsub.NewInMemoryBroker()
	sessions := session.NewSessionManager()
	wsHandler := ws.NewHandler(sessions, broker)

	fmt.Printf("ExamIdentity Realtime Service starting on port %s\n", port)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"realtime"}`))
	})
	http.Handle("/ws", wsHandler)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
