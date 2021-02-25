/*
 * Generated by asn1c-0.9.29 (http://lionet.info/asn1c)
 * From ASN.1 module "DSRC"
 * 	found in "j2735.asn"
 * 	`asn1c -fcompound-names -pdu=auto`
 */

#ifndef	_AntiLockBrakeStatus_H_
#define	_AntiLockBrakeStatus_H_


#include <asn_application.h>

/* Including external dependencies */
#include <NativeEnumerated.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Dependencies */
typedef enum AntiLockBrakeStatus {
	AntiLockBrakeStatus_unavailable	= 0,
	AntiLockBrakeStatus_off	= 1,
	AntiLockBrakeStatus_on	= 2,
	AntiLockBrakeStatus_engaged	= 3
} e_AntiLockBrakeStatus;

/* AntiLockBrakeStatus */
typedef long	 AntiLockBrakeStatus_t;

/* Implementation */
extern asn_per_constraints_t asn_PER_type_AntiLockBrakeStatus_constr_1;
extern asn_TYPE_descriptor_t asn_DEF_AntiLockBrakeStatus;
extern const asn_INTEGER_specifics_t asn_SPC_AntiLockBrakeStatus_specs_1;
asn_struct_free_f AntiLockBrakeStatus_free;
asn_struct_print_f AntiLockBrakeStatus_print;
asn_constr_check_f AntiLockBrakeStatus_constraint;
ber_type_decoder_f AntiLockBrakeStatus_decode_ber;
der_type_encoder_f AntiLockBrakeStatus_encode_der;
xer_type_decoder_f AntiLockBrakeStatus_decode_xer;
xer_type_encoder_f AntiLockBrakeStatus_encode_xer;
oer_type_decoder_f AntiLockBrakeStatus_decode_oer;
oer_type_encoder_f AntiLockBrakeStatus_encode_oer;
per_type_decoder_f AntiLockBrakeStatus_decode_uper;
per_type_encoder_f AntiLockBrakeStatus_encode_uper;

#ifdef __cplusplus
}
#endif

#endif	/* _AntiLockBrakeStatus_H_ */
#include <asn_internal.h>
