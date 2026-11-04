---
description: Hide or show the ANet badge on the linked ANet Sites site.
argument-hint: "hide | show"
skills: site-deploy
---

Use the `site-deploy` skill for this request:

$ARGUMENTS

Run `anet-site badge hide` (or `show` when the user wants it back) and report `badgeVisible`. Only paid plans can hide the badge; on error 3608 tell the user the free plan always shows it and they need to upgrade their ANet plan.
