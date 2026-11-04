---
description: Show ANet Sites usage and plan limits.
skills: site-deploy
---

Use the `site-deploy` skill for this request:

$ARGUMENTS

Run `anet-site usage` and show traffic, requests and storage against the plan limits for the current period. If `canDeploy` is false, explain `exceededReasons`: new deployments are paused until the next period, and upgrading the ANet plan raises the limits.
