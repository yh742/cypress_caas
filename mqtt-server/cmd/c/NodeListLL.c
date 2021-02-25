/*
 * Generated by asn1c-0.9.29 (http://lionet.info/asn1c)
 * From ASN.1 module "DSRC"
 * 	found in "j2735.asn"
 * 	`asn1c -fcompound-names -pdu=auto`
 */

#include "NodeListLL.h"

static asn_oer_constraints_t asn_OER_type_NodeListLL_constr_1 CC_NOTUSED = {
	{ 0, 0 },
	-1};
asn_per_constraints_t asn_PER_type_NodeListLL_constr_1 CC_NOTUSED = {
	{ APC_CONSTRAINED | APC_EXTENSIBLE,  0,  0,  0,  0 }	/* (0..0,...) */,
	{ APC_UNCONSTRAINED,	-1, -1,  0,  0 },
	0, 0	/* No PER value map */
};
asn_TYPE_member_t asn_MBR_NodeListLL_1[] = {
	{ ATF_NOFLAGS, 0, offsetof(struct NodeListLL, choice.nodes),
		(ASN_TAG_CLASS_CONTEXT | (0 << 2)),
		-1,	/* IMPLICIT tag at current level */
		&asn_DEF_NodeSetLL,
		0,
		{ 0, 0, 0 },
		0, 0, /* No default value */
		"nodes"
		},
};
static const asn_TYPE_tag2member_t asn_MAP_NodeListLL_tag2el_1[] = {
    { (ASN_TAG_CLASS_CONTEXT | (0 << 2)), 0, 0, 0 } /* nodes */
};
asn_CHOICE_specifics_t asn_SPC_NodeListLL_specs_1 = {
	sizeof(struct NodeListLL),
	offsetof(struct NodeListLL, _asn_ctx),
	offsetof(struct NodeListLL, present),
	sizeof(((struct NodeListLL *)0)->present),
	asn_MAP_NodeListLL_tag2el_1,
	1,	/* Count of tags in the map */
	0, 0,
	1	/* Extensions start */
};
asn_TYPE_descriptor_t asn_DEF_NodeListLL = {
	"NodeListLL",
	"NodeListLL",
	&asn_OP_CHOICE,
	0,	/* No effective tags (pointer) */
	0,	/* No effective tags (count) */
	0,	/* No tags (pointer) */
	0,	/* No tags (count) */
	{ &asn_OER_type_NodeListLL_constr_1, &asn_PER_type_NodeListLL_constr_1, CHOICE_constraint },
	asn_MBR_NodeListLL_1,
	1,	/* Elements count */
	&asn_SPC_NodeListLL_specs_1	/* Additional specs */
};

