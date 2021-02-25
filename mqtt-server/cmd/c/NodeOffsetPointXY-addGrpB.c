/*
 * Generated by asn1c-0.9.29 (http://lionet.info/asn1c)
 * From ASN.1 module "AddGrpB"
 * 	found in "j2735.asn"
 * 	`asn1c -fcompound-names -pdu=auto`
 */

#include "NodeOffsetPointXY-addGrpB.h"

static asn_oer_constraints_t asn_OER_type_NodeOffsetPointXY_addGrpB_constr_1 CC_NOTUSED = {
	{ 0, 0 },
	-1};
static asn_per_constraints_t asn_PER_type_NodeOffsetPointXY_addGrpB_constr_1 CC_NOTUSED = {
	{ APC_CONSTRAINED | APC_EXTENSIBLE,  1,  1,  0,  1 }	/* (0..1,...) */,
	{ APC_UNCONSTRAINED,	-1, -1,  0,  0 },
	0, 0	/* No PER value map */
};
static asn_TYPE_member_t asn_MBR_NodeOffsetPointXY_addGrpB_1[] = {
	{ ATF_NOFLAGS, 0, offsetof(struct NodeOffsetPointXY_addGrpB, choice.posA),
		(ASN_TAG_CLASS_CONTEXT | (0 << 2)),
		-1,	/* IMPLICIT tag at current level */
		&asn_DEF_Node_LLdms_48b,
		0,
		{ 0, 0, 0 },
		0, 0, /* No default value */
		"posA"
		},
	{ ATF_NOFLAGS, 0, offsetof(struct NodeOffsetPointXY_addGrpB, choice.posB),
		(ASN_TAG_CLASS_CONTEXT | (1 << 2)),
		-1,	/* IMPLICIT tag at current level */
		&asn_DEF_Node_LLdms_80b,
		0,
		{ 0, 0, 0 },
		0, 0, /* No default value */
		"posB"
		},
};
static const asn_TYPE_tag2member_t asn_MAP_NodeOffsetPointXY_addGrpB_tag2el_1[] = {
    { (ASN_TAG_CLASS_CONTEXT | (0 << 2)), 0, 0, 0 }, /* posA */
    { (ASN_TAG_CLASS_CONTEXT | (1 << 2)), 1, 0, 0 } /* posB */
};
static asn_CHOICE_specifics_t asn_SPC_NodeOffsetPointXY_addGrpB_specs_1 = {
	sizeof(struct NodeOffsetPointXY_addGrpB),
	offsetof(struct NodeOffsetPointXY_addGrpB, _asn_ctx),
	offsetof(struct NodeOffsetPointXY_addGrpB, present),
	sizeof(((struct NodeOffsetPointXY_addGrpB *)0)->present),
	asn_MAP_NodeOffsetPointXY_addGrpB_tag2el_1,
	2,	/* Count of tags in the map */
	0, 0,
	2	/* Extensions start */
};
asn_TYPE_descriptor_t asn_DEF_NodeOffsetPointXY_addGrpB = {
	"NodeOffsetPointXY-addGrpB",
	"NodeOffsetPointXY-addGrpB",
	&asn_OP_CHOICE,
	0,	/* No effective tags (pointer) */
	0,	/* No effective tags (count) */
	0,	/* No tags (pointer) */
	0,	/* No tags (count) */
	{ &asn_OER_type_NodeOffsetPointXY_addGrpB_constr_1, &asn_PER_type_NodeOffsetPointXY_addGrpB_constr_1, CHOICE_constraint },
	asn_MBR_NodeOffsetPointXY_addGrpB_1,
	2,	/* Elements count */
	&asn_SPC_NodeOffsetPointXY_addGrpB_specs_1	/* Additional specs */
};

