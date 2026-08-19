#!/usr/bin/env python3
"""Deterministic amount validation and invoice dedupe helpers for reimbursement skill."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from typing import Any


def nearly_equal(a: float, b: float, tol: float = 0.01) -> bool:
    return abs(a - b) <= tol


def validate_ticket(ticket: dict[str, Any]) -> dict[str, Any]:
    excl = float(ticket.get("amount_excl_tax") or 0)
    tax = float(ticket.get("tax_amount") or 0)
    incl = float(ticket.get("amount_incl_tax") or 0)
    ok = nearly_equal(excl + tax, incl)
    return {
        "ticket_id": ticket.get("ticket_id"),
        "amount_ok": ok,
        "expected_incl": round(excl + tax, 2),
        "actual_incl": incl,
    }


def dedupe_key(ticket: dict[str, Any]) -> str:
    number = (ticket.get("invoice_number") or "").strip()
    if number:
        code = (ticket.get("invoice_code") or "").strip()
        return f"num:{code}:{number}"
    seller = (ticket.get("seller_name") or "").strip()
    date = (ticket.get("invoice_date") or "").strip()
    incl = ticket.get("amount_incl_tax")
    return f"fallback:{seller}|{date}|{incl}"


def find_duplicates(tickets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for t in tickets:
        groups[dedupe_key(t)].append(str(t.get("ticket_id")))
    return [
        {"key": k, "ticket_ids": ids}
        for k, ids in groups.items()
        if len(ids) > 1
    ]


def main() -> int:
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"error": "empty stdin"}, ensure_ascii=False))
        return 1
    data = json.loads(raw)
    tickets = data if isinstance(data, list) else data.get("tickets", [])
    result = {
        "validations": [validate_ticket(t) for t in tickets],
        "duplicates": find_duplicates(tickets),
        "submit_sum": round(
            sum(float(t.get("suggested_claim_amount") or 0) for t in tickets), 2
        ),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
