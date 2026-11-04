import { formatJson } from "@anet/core";
import type { GlobalOptions, RunContext } from "@anet/shared-types";
import { loadBootstrapModule } from "./bootstrap-loader.js";
import { loadCliDotenv } from "./env.js";
import type { RunDependencies } from "./cli-types.js";
import { resolveFamilyLabel } from "./command-center/login-flow.js";

export async function runLoginCommand(
  ctx: RunContext,
  options: GlobalOptions,
  deps: RunDependencies,
  noBrowser: boolean,
  args: readonly string[] = [],
): Promise<number> {
  try {
    const providerId = args[0];
    if (args.length !== 1 || !providerId) {
      throw new Error("Usage: anet login <provider> [--no-browser]");
    }
    // 家族是否已注册由 loginANetCli 在发起授权前校验;未注册时如实报错,不回退到默认家族。
    const env = deps.env ?? process.env;
    const workingDirectory = (deps.cwd ?? process.cwd)();
    const dotenvResult = (deps.loadDotenv ?? loadCliDotenv)({
      cwd: workingDirectory,
      env,
    });

    if (dotenvResult.error) {
      throw new Error(`Failed to load environment file: ${dotenvResult.path}`, {
        cause: dotenvResult.error,
      });
    }

    const login = deps.loginANetCli ?? (await loadBootstrapModule()).loginANetCli;
    const result = await login({
      env,
      noBrowser,
      providerId,
      onAuthorizeUrl: (data) => {
        writeAuthorizeUrl(ctx, options, data.authorize_url, noBrowser, resolveFamilyLabel(providerId));
      },
      onBrowserOpen: (browser) => {
        if (!options.json && !browser.opened) {
          ctx.stdout.write(`Browser open failed: ${browser.reason ?? "unknown error"}\n`);
        }
      },
    });

    if (options.json) {
      ctx.stdout.write(
        formatJson({
          status: "ready",
          provider: result.providerId,
          user: {
            user_id: result.user.user_id,
            ...(result.user.email ? { email: result.user.email } : {}),
            ...(result.user.name ? { name: result.user.name } : {}),
            ...(result.user.avatar ? { avatar: result.user.avatar } : {}),
          },
          model: result.model,
          credentialsPath: result.credentialsPath,
          configPath: result.configPath,
          browserOpened: result.browser?.opened ?? false,
        }),
      );
      return 0;
    }

    ctx.stdout.write(
      [
        `Login successful${formatUserLabel(result.user)}.`,
        `Model: ${result.model}`,
        `Credentials: ${result.credentialsPath}`,
        `Model selection: ${result.configPath}`,
      ].join("\n") + "\n",
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.stderr.write(`Error: ${message}\n`);
    if (options.verbose && error instanceof Error && error.stack) {
      ctx.stderr.write(`${error.stack}\n`);
    }
    return 1;
  }
}

export async function runLogoutCommand(
  ctx: RunContext,
  options: GlobalOptions,
  deps: RunDependencies,
): Promise<number> {
  try {
    const env = deps.env ?? process.env;
    const workingDirectory = (deps.cwd ?? process.cwd)();
    const dotenvResult = (deps.loadDotenv ?? loadCliDotenv)({
      cwd: workingDirectory,
      env,
    });

    if (dotenvResult.error) {
      throw new Error(`Failed to load environment file: ${dotenvResult.path}`, {
        cause: dotenvResult.error,
      });
    }

    const logout = deps.logoutANetCli ?? (await loadBootstrapModule()).logoutANetCli;
    const result = await logout({ env });

    if (options.json) {
      ctx.stdout.write(
        formatJson({
          status: "logged_out",
          credentialsPath: result.credentialsPath,
        }),
      );
      return 0;
    }

    ctx.stdout.write(
      `Logged out from Coding Plan accounts. Credentials: ${result.credentialsPath}\n`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.stderr.write(`Error: ${message}\n`);
    if (options.verbose && error instanceof Error && error.stack) {
      ctx.stderr.write(`${error.stack}\n`);
    }
    return 1;
  }
}

function writeAuthorizeUrl(
  ctx: RunContext,
  options: GlobalOptions,
  authorizeUrl: string,
  noBrowser: boolean,
  providerLabel: string,
): void {
  const target = options.json ? ctx.stderr : ctx.stdout;
  if (noBrowser) {
    target.write(`Open this URL to sign in:\n${authorizeUrl}\n`);
    return;
  }

  target.write(
    `Opening browser for ${providerLabel} authorization.\nFallback URL:\n${authorizeUrl}\n`,
  );
}

function formatUserLabel(user: { email?: string; name?: string; user_id: string }): string {
  const label = user.name || user.email || user.user_id;
  return label ? ` as ${label}` : "";
}
