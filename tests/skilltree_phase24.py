#!/usr/bin/env python3
"""Static Phase-24 skilltree checks; no browser or third-party packages required."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "data/skills.json").read_text(encoding="utf-8"))
combat = json.loads((ROOT / "data/combat.json").read_text(encoding="utf-8"))
skills, specials = data["skills"], data["specials"]
ids = {n["id"] for n in skills}
assert len(ids) == 80 and len(ids) == len(skills), "skill IDs must be unique"
assert len(specials) == 10 and len({n["id"] for n in specials}) == 10
assert sum(n["type"] == "passive" for n in skills) == 60
assert sum(n["type"] == "active" for n in skills) == 20
for br in data["branches"]:
    nodes = [n for n in skills if n["br"] == br]
    assert sum(n["type"] == "passive" for n in nodes) == 15
    assert sum(n["type"] == "active" for n in nodes) == 5
    for line in range(1, 6):
        ranks = sorted(n["rank"] for n in nodes if n.get("line") == line)
        assert ranks == [1, 2, 3], (br, line, ranks)
for n in skills:
    assert all(req in ids for req in n.get("req", [])), n["id"]
    if n["type"] == "active":
        assert n["move"] in combat["moves"], n["id"]
        assert n["move"] not in {x["move"] for x in data["secrets"] + data["scrolls"]}, n["id"]
assert all(n["unlock"] in {"tree", "karma", "quest", "yinyang"} for n in specials)
assert all(n["via"] in ids for n in data["crossLinks"])
sp = sum(n["cost"]["sp"] for n in skills)
ess = sum(n["cost"]["ess"] for n in skills)
assert (sp, ess) == (176, 196), (sp, ess)
print("PASS Phase 24: 60 passive, 20 active, 10 special; branches, prerequisites, moves, links and costs valid.")
print(f"PASS Total costs: {sp} SP / {ess} Essence (special skills free to unlock).")
