package main

// #cgo CFLAGS: -I${SRCDIR}/c/
// #cgo LDFLAGS: -L${SRCDIR}/c/ -lasncodec -lm
// #include <MessageFrame.h>
// #include <stdlib.h>
// #include <xer_encoder.h>
// #include <per_decoder.h>
// size_t msgframe_size()
// {
//		return sizeof(MessageFrame_t);
// }
// void free_struct(asn_TYPE_descriptor_t descriptor, void* frame) {
// 		ASN_STRUCT_FREE(descriptor, frame);
// }
import "C"
import (
	"encoding/binary"
	"errors"
	"fmt"
	"time"
	"unsafe"

	"github.com/golang/protobuf/proto"
	"github.com/golang/protobuf/ptypes"
	"github.com/rs/zerolog/log"
)

func octetStringToGoString(oString *C.OCTET_STRING_t) string {
	size := int(oString.size)
	str := ""
	for x := 0; x < size; x++ {
		octetByte := *(*byte)(unsafe.Pointer(uintptr(unsafe.Pointer(oString.buf)) + uintptr(x)))
		if x == size-1 {
			str += fmt.Sprintf("%02X", octetByte)
			break
		}
		str += fmt.Sprintf("%02X ", octetByte)
	}
	return str
}

func decodeMessageFrame(descriptor *C.asn_TYPE_descriptor_t, bytes []byte, length uint64) *C.MessageFrame_t {
	var decoded unsafe.Pointer
	cBytes := C.CBytes(bytes)
	defer C.free(cBytes)
	rval := C.uper_decode_complete(
		nil,
		descriptor,
		&decoded,
		cBytes,
		C.ulong(length))
	if rval.code != C.RC_OK {
		err := fmt.Sprintf("Broken Rectangle encoding at byte %d", (uint64)(rval.consumed))
		log.Error().
			Msg(err)
		return nil
	}
	return (*C.MessageFrame_t)(decoded)
}

// GetID returns the ID of the messageframe
func GetID(bytes []byte) (uint32, int, error) {
	// deserialize if using protobuf
	// var clientMsg routedmsgpb.RoutedMsg
	// if err := proto.Unmarshal(bytes, &clientMsg); err != nil {
	// 	log.Error().Msg("Cannot deserialize protobuf message")
	// 	return 0, errors.New("Cannot deserialize protobuf message")
	// }

	var msgFrame *C.MessageFrame_t = nil
	msgFrame = decodeMessageFrame(&C.asn_DEF_MessageFrame, bytes, uint64(len(bytes)))
	defer C.free_struct(C.asn_DEF_MessageFrame, unsafe.Pointer(msgFrame))
	localFrame := *msgFrame
	cTempID := (*[4]byte)(unsafe.Pointer(((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.id.buf))[:4:4]
	msgCnt := int(((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.msgCnt)
	return binary.BigEndian.Uint32(cTempID), msgCnt, nil
}

// SetParams replaces ID in message
func SetParams(bytes []byte, tempID uint32, msgCnt int, lat int, long int) ([]byte, error) {
	// deserialize if using protobuf
	var clientMsg RoutedMsg
	if err := proto.Unmarshal(bytes, &clientMsg); err != nil {
		log.Error().Msg("Cannot deserialize protobuf message")
		return nil, errors.New("Cannot deserialize protobuf message")
	}

	var msgFrame *C.MessageFrame_t = nil
	cliBytes := clientMsg.GetMsgBytes()
	msgFrame = decodeMessageFrame(&C.asn_DEF_MessageFrame, cliBytes, uint64(len(cliBytes)))
	defer C.free_struct(C.asn_DEF_MessageFrame, unsafe.Pointer(msgFrame))
	newBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(newBuf, tempID)
	localFrame := *msgFrame
	((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.id.buf = (*C.uchar)(unsafe.Pointer(&newBuf[0]))
	((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.msgCnt = C.long(msgCnt)
	((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.Long = C.long(long)
	((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.lat = C.long(lat)
	((*C.BasicSafetyMessage_t)(unsafe.Pointer(&localFrame.value.choice))).coreData.secMark = C.long(time.Now().Second()*1000 + time.Now().Nanosecond()/1000000)

	sz := int(C.msgframe_size())
	dest := make([]byte, sz)
	copy(dest, (*(*[1024]byte)(unsafe.Pointer(&localFrame)))[:sz:sz])

	ptr := C.malloc(C.sizeof_char * 1024)
	defer C.free(ptr)
	rval := C.uper_encode_to_buffer(&C.asn_DEF_MessageFrame, nil, unsafe.Pointer(&dest[0]), ptr, C.ulong(C.sizeof_char*1024))
	msg := C.GoBytes(ptr, C.int(rval.encoded))

	ts, err := ptypes.TimestampProto(time.Now())

	newMessage := &RoutedMsg{
		MsgBytes: msg,
		Time:     ts,
		Position: &Position{
			Longitude: int32(long),
			Latitude:  int32(lat),
		},
	}

	data, err := proto.Marshal(newMessage)
	if err != nil {
		return nil, err
	}
	return data, nil
}
