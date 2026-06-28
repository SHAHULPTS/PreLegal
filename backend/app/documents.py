"""Document registry: catalog, hand-authored field specs, and templates.

PL-6 generalizes the product from the single Mutual NDA to multiple Common Paper
document types. Each *supported* document has:

- a friendly name + description (shown to the user and given to the AI so it can
  route a request to the right document, or suggest the closest one),
- a hand-authored **field spec** — the key terms the AI collects over the chat
  and the user can fine-tune by hand, and
- a markdown **template** in ``templates/`` that is rendered (cover page of key
  terms + standard terms) by the frontend.

Adding another document is just adding a ``DocumentSpec`` here (and confirming
its template exists). The field spec also drives the LLM Structured Outputs
schema via :func:`build_fields_model`.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, create_model

FieldType = Literal["text", "textarea", "date", "years", "select"]


class FieldOption(BaseModel):
    value: str
    label: str


class FieldSpec(BaseModel):
    """One fillable key term of a document."""

    key: str
    label: str
    type: FieldType = "text"
    hint: str = ""
    options: list[FieldOption] = Field(default_factory=list)
    # Groups related fields in the UI (e.g. the two signing parties).
    group: str = ""


class DocumentSpec(BaseModel):
    id: str
    name: str
    description: str
    # Repo-relative path to the markdown template (e.g. "templates/DPA.md").
    template_path: str
    fields: list[FieldSpec]


# ---------------------------------------------------------------------------
# Field-spec building blocks
# ---------------------------------------------------------------------------


def _party(prefix: str, role: str) -> list[FieldSpec]:
    """The four signature-block fields for one party (e.g. ``party1``)."""
    return [
        FieldSpec(key=f"{prefix}CompanyName", label=f"{role}: Company name", group=prefix),
        FieldSpec(key=f"{prefix}SignatoryName", label=f"{role}: Signatory name", group=prefix),
        FieldSpec(key=f"{prefix}Title", label=f"{role}: Title", group=prefix),
        FieldSpec(
            key=f"{prefix}NoticeAddress",
            label=f"{role}: Notice address",
            hint="Email or postal address",
            group=prefix,
        ),
    ]


_MNDA_TERM_OPTIONS = [
    FieldOption(value="fixed", label="Expires a set number of years after the Effective Date"),
    FieldOption(value="untilTerminated", label="Continues until terminated"),
]

_CONFIDENTIALITY_TERM_OPTIONS = [
    FieldOption(value="fixed", label="A set number of years after the Effective Date"),
    FieldOption(value="perpetuity", label="In perpetuity"),
]


# ---------------------------------------------------------------------------
# Supported documents (framework + 4 docs for PL-6)
# ---------------------------------------------------------------------------

_SPECS: list[DocumentSpec] = [
    DocumentSpec(
        id="mutual-nda",
        name="Mutual Non-Disclosure Agreement",
        description=(
            "A Mutual NDA for two parties to share confidential information while "
            "evaluating or pursuing a business relationship."
        ),
        template_path="templates/Mutual-NDA.md",
        fields=[
            FieldSpec(
                key="purpose",
                label="Purpose",
                type="textarea",
                hint="How the shared Confidential Information may be used",
            ),
            FieldSpec(key="effectiveDate", label="Effective Date", type="date"),
            FieldSpec(
                key="mndaTermType",
                label="MNDA Term",
                type="select",
                hint="How long this MNDA lasts",
                options=_MNDA_TERM_OPTIONS,
            ),
            FieldSpec(
                key="mndaTermYears",
                label="MNDA Term length (years)",
                type="years",
                hint="Used when the MNDA expires after a fixed term",
            ),
            FieldSpec(
                key="confidentialityTermType",
                label="Term of Confidentiality",
                type="select",
                hint="How long Confidential Information stays protected",
                options=_CONFIDENTIALITY_TERM_OPTIONS,
            ),
            FieldSpec(
                key="confidentialityTermYears",
                label="Confidentiality length (years)",
                type="years",
                hint="Used when confidentiality lasts a fixed term",
            ),
            FieldSpec(key="governingLaw", label="Governing Law", hint="U.S. state, e.g. Delaware"),
            FieldSpec(
                key="jurisdiction",
                label="Jurisdiction",
                hint='City/county and state, e.g. "New Castle, DE"',
            ),
            FieldSpec(
                key="modifications",
                label="MNDA Modifications",
                type="textarea",
                hint="Any changes to the standard terms (optional)",
            ),
            *_party("party1", "Party 1"),
            *_party("party2", "Party 2"),
        ],
    ),
    DocumentSpec(
        id="data-processing-agreement",
        name="Data Processing Agreement",
        description=(
            "A DPA governing how one party processes personal data on behalf of "
            "another, in compliance with data-protection laws."
        ),
        template_path="templates/DPA.md",
        fields=[
            FieldSpec(key="effectiveDate", label="Effective Date", type="date"),
            FieldSpec(
                key="natureAndPurpose",
                label="Nature & Purpose of Processing",
                type="textarea",
                hint="Why the personal data is processed",
            ),
            FieldSpec(
                key="categoriesOfPersonalData",
                label="Categories of Personal Data",
                type="textarea",
                hint="What kinds of personal data are processed",
            ),
            FieldSpec(
                key="categoriesOfDataSubjects",
                label="Categories of Data Subjects",
                type="textarea",
                hint="Whose data is processed (e.g. customers, employees)",
            ),
            FieldSpec(
                key="durationOfProcessing",
                label="Duration of Processing",
                hint="How long processing continues",
            ),
            FieldSpec(
                key="frequencyOfTransfer",
                label="Frequency of Transfer",
                hint="e.g. one-off or continuous",
            ),
            FieldSpec(
                key="approvedSubprocessors",
                label="Approved Subprocessors",
                type="textarea",
                hint="Any sub-processors permitted (optional)",
            ),
            FieldSpec(
                key="governingMemberState",
                label="Governing Member State",
                hint="Member state whose data-protection law governs",
            ),
            FieldSpec(
                key="providerSecurityContact",
                label="Provider Security Contact",
                hint="Email for security matters",
            ),
            *_party("party1", "Provider"),
            *_party("party2", "Customer"),
        ],
    ),
    DocumentSpec(
        id="pilot-agreement",
        name="Pilot Agreement",
        description=(
            "A time-limited Pilot Agreement for a customer to evaluate a product "
            "before a full commercial engagement."
        ),
        template_path="templates/Pilot-Agreement.md",
        fields=[
            FieldSpec(key="effectiveDate", label="Effective Date", type="date"),
            FieldSpec(
                key="pilotPeriod",
                label="Pilot Period",
                hint="Length of the pilot, e.g. 60 days from the Effective Date",
            ),
            FieldSpec(key="governingLaw", label="Governing Law", hint="U.S. state, e.g. Delaware"),
            FieldSpec(
                key="chosenCourts",
                label="Chosen Courts",
                hint="Courts that will hear disputes",
            ),
            FieldSpec(
                key="generalCapAmount",
                label="General Cap Amount",
                hint="Liability cap, e.g. $50,000",
            ),
            *_party("party1", "Provider"),
            *_party("party2", "Customer"),
        ],
    ),
    DocumentSpec(
        id="cloud-service-agreement",
        name="Cloud Service Agreement",
        description=(
            "A Cloud Service Agreement (CSA) for providing access to a cloud-based "
            "or SaaS product on a subscription basis."
        ),
        template_path="templates/CSA.md",
        fields=[
            FieldSpec(key="effectiveDate", label="Effective Date", type="date"),
            FieldSpec(key="orderDate", label="Order Date", type="date"),
            FieldSpec(
                key="subscriptionPeriod",
                label="Subscription Period",
                hint="e.g. 12 months from the Effective Date",
            ),
            FieldSpec(
                key="paymentProcess",
                label="Payment Process",
                type="textarea",
                hint="How and when fees are paid",
            ),
            FieldSpec(
                key="technicalSupport",
                label="Technical Support",
                type="textarea",
                hint="Support commitments (optional)",
            ),
            FieldSpec(key="governingLaw", label="Governing Law", hint="U.S. state, e.g. Delaware"),
            FieldSpec(
                key="chosenCourts",
                label="Chosen Courts",
                hint="Courts that will hear disputes",
            ),
            FieldSpec(
                key="generalCapAmount",
                label="General Cap Amount",
                hint="Liability cap, e.g. fees paid in the prior 12 months",
            ),
            *_party("party1", "Provider"),
            *_party("party2", "Customer"),
        ],
    ),
]

_BY_ID: dict[str, DocumentSpec] = {spec.id: spec for spec in _SPECS}


# ---------------------------------------------------------------------------
# File resolution + accessors
# ---------------------------------------------------------------------------


def _data_root() -> Path:
    """Locate the directory holding ``catalog.json`` and ``templates/``.

    Works both locally (repo root, two levels above this package) and in the
    Docker image (where they are copied next to the app at ``/app``).
    """
    here = Path(__file__).resolve()
    candidates = [here.parents[2], here.parents[1], Path.cwd()]
    for root in candidates:
        if (root / "catalog.json").is_file():
            return root
    raise FileNotFoundError(
        "catalog.json not found; checked: " + ", ".join(str(c) for c in candidates)
    )


def list_documents() -> list[DocumentSpec]:
    """All supported documents."""
    return list(_SPECS)


def get_document(doc_id: str) -> DocumentSpec | None:
    return _BY_ID.get(doc_id)


def is_supported(doc_id: str) -> bool:
    return doc_id in _BY_ID


@lru_cache(maxsize=None)
def template_markdown(doc_id: str) -> str:
    """The raw markdown template for a supported document."""
    spec = _BY_ID[doc_id]
    return (_data_root() / spec.template_path).read_text(encoding="utf-8")


def empty_values(doc_id: str) -> dict[str, str]:
    """Default (blank, or first select option) value for every field."""
    spec = _BY_ID[doc_id]
    values: dict[str, str] = {}
    for field in spec.fields:
        values[field.key] = field.options[0].value if field.type == "select" and field.options else ""
    return values


def build_fields_model(doc_id: str) -> type[BaseModel]:
    """Build a Pydantic model for a document's fields (Structured Outputs schema)."""
    spec = _BY_ID[doc_id]
    field_defs: dict[str, tuple[object, object]] = {}
    for field in spec.fields:
        if field.type == "select" and field.options:
            literal = Literal[tuple(opt.value for opt in field.options)]  # type: ignore[misc]
            field_defs[field.key] = (literal, field.options[0].value)
        else:
            field_defs[field.key] = (str, "")
    model_name = "".join(part.capitalize() for part in doc_id.split("-")) + "Fields"
    return create_model(model_name, **field_defs)  # type: ignore[call-overload]
