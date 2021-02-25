/*
 * Generated by asn1c-0.9.29 (http://lionet.info/asn1c)
 * From ASN.1 module "DSRC"
 * 	found in "j2735.asn"
 * 	`asn1c -fcompound-names -pdu=auto`
 */

#ifndef	_MessageFrame_H_
#define	_MessageFrame_H_


#include <asn_application.h>

/* Including external dependencies */
#include "DSRCmsgID.h"
#include <ANY.h>
#include <asn_ioc.h>
#include "BasicSafetyMessage.h"
#include "MapData.h"
#include "SPAT.h"
#include "CommonSafetyRequest.h"
#include "EmergencyVehicleAlert.h"
#include "IntersectionCollision.h"
#include "NMEAcorrections.h"
#include "ProbeDataManagement.h"
#include "ProbeVehicleData.h"
#include "RoadSideAlert.h"
#include "RTCMcorrections.h"
#include "SignalRequestMessage.h"
#include "SignalStatusMessage.h"
#include "TravelerInformation.h"
#include "PersonalSafetyMessage.h"
#include "SignalAheadMessage.h"
#include "DataRequestMessage.h"
#include "DataRequestResponse.h"
#include "StatusMessage.h"
#include "DisconnectMessage.h"
#include <OPEN_TYPE.h>
#include <constr_CHOICE.h>
#include <constr_SEQUENCE.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Dependencies */
typedef enum MessageFrame__value_PR {
	MessageFrame__value_PR_NOTHING,	/* No components present */
	MessageFrame__value_PR_BasicSafetyMessage,
	MessageFrame__value_PR_MapData,
	MessageFrame__value_PR_SPAT,
	MessageFrame__value_PR_CommonSafetyRequest,
	MessageFrame__value_PR_EmergencyVehicleAlert,
	MessageFrame__value_PR_IntersectionCollision,
	MessageFrame__value_PR_NMEAcorrections,
	MessageFrame__value_PR_ProbeDataManagement,
	MessageFrame__value_PR_ProbeVehicleData,
	MessageFrame__value_PR_RoadSideAlert,
	MessageFrame__value_PR_RTCMcorrections,
	MessageFrame__value_PR_SignalRequestMessage,
	MessageFrame__value_PR_SignalStatusMessage,
	MessageFrame__value_PR_TravelerInformation,
	MessageFrame__value_PR_PersonalSafetyMessage,
	MessageFrame__value_PR_SignalAheadMessage,
	MessageFrame__value_PR_DataRequestMessage,
	MessageFrame__value_PR_DataRequestResponse,
	MessageFrame__value_PR_StatusMessage,
	MessageFrame__value_PR_DisconnectMessage
} MessageFrame__value_PR;

/* MessageFrame */
typedef struct MessageFrame {
	DSRCmsgID_t	 messageId;
	struct MessageFrame__value {
		MessageFrame__value_PR present;
		union MessageFrame__value_u {
			BasicSafetyMessage_t	 BasicSafetyMessage;
			MapData_t	 MapData;
			SPAT_t	 SPAT;
			CommonSafetyRequest_t	 CommonSafetyRequest;
			EmergencyVehicleAlert_t	 EmergencyVehicleAlert;
			IntersectionCollision_t	 IntersectionCollision;
			NMEAcorrections_t	 NMEAcorrections;
			ProbeDataManagement_t	 ProbeDataManagement;
			ProbeVehicleData_t	 ProbeVehicleData;
			RoadSideAlert_t	 RoadSideAlert;
			RTCMcorrections_t	 RTCMcorrections;
			SignalRequestMessage_t	 SignalRequestMessage;
			SignalStatusMessage_t	 SignalStatusMessage;
			TravelerInformation_t	 TravelerInformation;
			PersonalSafetyMessage_t	 PersonalSafetyMessage;
			SignalAheadMessage_t	 SignalAheadMessage;
			DataRequestMessage_t	 DataRequestMessage;
			DataRequestResponse_t	 DataRequestResponse;
			StatusMessage_t	 StatusMessage;
			DisconnectMessage_t	 DisconnectMessage;
		} choice;
		
		/* Context for parsing across buffer boundaries */
		asn_struct_ctx_t _asn_ctx;
	} value;
	/*
	 * This type is extensible,
	 * possible extensions are below.
	 */
	
	/* Context for parsing across buffer boundaries */
	asn_struct_ctx_t _asn_ctx;
} MessageFrame_t;

/* Implementation */
extern asn_TYPE_descriptor_t asn_DEF_MessageFrame;

#ifdef __cplusplus
}
#endif

#endif	/* _MessageFrame_H_ */
#include <asn_internal.h>