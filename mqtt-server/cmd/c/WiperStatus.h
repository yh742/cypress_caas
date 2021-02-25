/*
 * Generated by asn1c-0.9.29 (http://lionet.info/asn1c)
 * From ASN.1 module "DSRC"
 * 	found in "j2735.asn"
 * 	`asn1c -fcompound-names -pdu=auto`
 */

#ifndef	_WiperStatus_H_
#define	_WiperStatus_H_


#include <asn_application.h>

/* Including external dependencies */
#include <NativeEnumerated.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Dependencies */
typedef enum WiperStatus {
	WiperStatus_unavailable	= 0,
	WiperStatus_off	= 1,
	WiperStatus_intermittent	= 2,
	WiperStatus_low	= 3,
	WiperStatus_high	= 4,
	WiperStatus_washerInUse	= 5,
	WiperStatus_automaticPresent	= 6
	/*
	 * Enumeration is extensible
	 */
} e_WiperStatus;

/* WiperStatus */
typedef long	 WiperStatus_t;

/* Implementation */
extern asn_per_constraints_t asn_PER_type_WiperStatus_constr_1;
extern asn_TYPE_descriptor_t asn_DEF_WiperStatus;
extern const asn_INTEGER_specifics_t asn_SPC_WiperStatus_specs_1;
asn_struct_free_f WiperStatus_free;
asn_struct_print_f WiperStatus_print;
asn_constr_check_f WiperStatus_constraint;
ber_type_decoder_f WiperStatus_decode_ber;
der_type_encoder_f WiperStatus_encode_der;
xer_type_decoder_f WiperStatus_decode_xer;
xer_type_encoder_f WiperStatus_encode_xer;
oer_type_decoder_f WiperStatus_decode_oer;
oer_type_encoder_f WiperStatus_encode_oer;
per_type_decoder_f WiperStatus_decode_uper;
per_type_encoder_f WiperStatus_encode_uper;

#ifdef __cplusplus
}
#endif

#endif	/* _WiperStatus_H_ */
#include <asn_internal.h>