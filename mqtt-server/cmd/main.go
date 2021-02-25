package main

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"time"

	"github.com/eclipse/paho.golang/paho"
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
)

const MQTT_SERVER = "3.140.189.249:31403"
const MSG = `0A280014251D8BA1C50955EBA76DC1991CB33F8000007FFFFFFFF06699F4FDFA1FA1007FFF00006412B8120C08DAD084FB0510CEE480C3021A1108B2B4DAC9011081DAF2F0FCFFFFFFFF01`

func main() {

	clientList = map[string]*paho.Client{}
	router := mux.NewRouter()
	router.Handle("/connect", http.HandlerFunc(connect()))
	router.Handle("/connect/clients", http.HandlerFunc(list()))
	router.Handle("/connect/clients/publish", http.HandlerFunc(publish()))
	router.Handle("/disconnect/clients", http.HandlerFunc(disList()))
	router.Handle("/flush", http.Handler(flush()))
	srv := &http.Server{
		Addr:    ":9090",
		Handler: router,
	}
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatal().Msgf("ListenAndServe() failed: %+v", err)
	}
}

type ConnectInput struct {
	EntityID string
	Token    string
	ID       string
}

type PublishMessage struct {
	ConnectInput
	Message string
	Topic   string
}

var clientList map[string]*paho.Client
var disconnectList map[string]byte

func flush() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		clientList = map[string]*paho.Client{}
		disconnectList = map[string]byte{}
	}
}
func publish() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		pubMsg := &PublishMessage{}
		dec := json.NewDecoder(req.Body)
		err := dec.Decode(pubMsg)
		if err != nil {
			log.Error().Msgf("Unable to decode publish message, %s", err)
			w.WriteHeader(http.StatusBadRequest)
		}
		clientID := "VEH-" + pubMsg.EntityID + "-" + pubMsg.ID
		log.Debug().Msgf("publish for %s to %s...", clientID, pubMsg.Topic)
		// b, _ := hex.DecodeString(MSG)
		// num, _ := strconv.Atoi(pubMsg.EntityID)
		// bytes, err := SetParams(b, uint32(num), 0, 423008818, -836981503)
		// if err != nil {
		// 	log.Fatal().Msgf("cannot encode sample hex string, %v", err)
		// }
		if val, ok := clientList[clientID]; ok {
			resp, err := val.Publish(context.Background(), &paho.Publish{
				QoS:     0,
				Retain:  false,
				Topic:   pubMsg.Topic,
				Payload: []byte("test"),
			})
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
			}
			log.Debug().Msgf("response: %+v", resp)
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}
}

func list() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		keys := make([]string, 0, len(clientList))
		for k := range clientList {
			keys = append(keys, k)
		}
		bytes, err := json.Marshal(keys)
		if err != nil {
			log.Error().Msgf("error occured: %s", err)
			w.WriteHeader(http.StatusBadRequest)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(bytes)
	}
}

func disList() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		bytes, err := json.Marshal(disconnectList)
		if err != nil {
			log.Error().Msgf("error occured: %s", err)
			w.WriteHeader(http.StatusBadRequest)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(bytes)
	}
}

func connect() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		cInput := &ConnectInput{}
		dec := json.NewDecoder(req.Body)
		err := dec.Decode(cInput)
		if err != nil {
			log.Error().Msgf("error occured: %s", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		conn, err := net.Dial("tcp", MQTT_SERVER)
		if err != nil {
			log.Error().Msgf("cannot create connection to server: %s", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		cp := &paho.Connect{
			KeepAlive:    30,
			CleanStart:   true,
			UsernameFlag: true,
			PasswordFlag: true,
			Username:     "VEH-" + cInput.EntityID,
			Password:     []byte(cInput.Token),
			ClientID:     "VEH-" + cInput.EntityID + "-" + cInput.ID,
		}

		c := paho.NewClient(paho.ClientConfig{
			Conn: conn,
		})
		c.OnServerDisconnect = func(clientID string) func(*paho.Disconnect) {
			return func(dis *paho.Disconnect) {
				log.Debug().Msgf("disconnect called for %s, %d, %s", clientID, dis.ReasonCode, dis.Properties.ReasonString)
				if _, ok := clientList[clientID]; ok {
					delete(clientList, clientID)
					disconnectList[clientID] = dis.ReasonCode
				}
			}
		}(cp.ClientID)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		ca, err := c.Connect(ctx, cp)
		if err != nil {
			log.Error().Msgf("cannot connect to server: %s", err)
			log.Error().Msgf("details: %d, %s", ca.ReasonCode, ca.Properties.ReasonString)
			w.WriteHeader(http.StatusUnauthorized)
		} else {
			log.Info().Msgf("connected successfully %s", cp.Username)
			w.WriteHeader(http.StatusOK)
			clientList[c.ClientID] = c
		}
	}
}
