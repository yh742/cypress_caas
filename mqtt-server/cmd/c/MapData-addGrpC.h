/*
 * Generated by asn1c-0.9.29 (http://lionet.info/asn1c)
 * From ASN.1 module "AddGrpC"
 * 	found in "j2735.asn"
 * 	`asn1c -fcompound-names -pdu=auto`
 */

#ifndef	_MapData_addGrpC_H_
#define	_MapData_addGrpC_H_


#include <asn_application.h>

/* Including external dependencies */
#include <constr_SEQUENCE.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Forward declarations */
struct SignalHeadLocationList;

/* MapData-addGrpC */
typedef struct MapData_addGrpC {
	struct SignalHeadLocationList	*signalHeadLocations	/* OPTIONAL */;
	/*
	 * This type is extensible,
	 * possible extensions are below.
	 */
	
	/* Context for parsing across buffer boundaries */
	asn_struct_ctx_t _asn_ctx;
} MapData_addGrpC_t;

/* Implementation */
extern asn_TYPE_descriptor_t asn_DEF_MapData_addGrpC;

#ifdef __cplusplus
}
#endif

/* Referred external types */
#include "SignalHeadLocationList.h"

#endif	/* _MapData_addGrpC_H_ */
#include <asn_internal.h>
