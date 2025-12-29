import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse } from "next/server";
import i18nConfig from "@/../i18n.config";
import { polar } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";

function getLocale(request: Request): string {
  const headers = {
    "accept-language": request.headers.get("accept-language") || "",
  };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, i18nConfig.locales, i18nConfig.defaultLocale);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const locale = getLocale(request);

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await polar.customers.getExternal({ externalId: user.id });
      } catch (error) {
        if (error instanceof Error && error.name === "ResourceNotFound") {
          await polar.customers.create({
            externalId: user.id,
            email: user.email!,
            name: user.user_metadata.full_name,
          });
          await polar.subscriptions.create({
            externalCustomerId: user.id,
            productId: "d603bffa-78e5-468c-bce6-b909577073dc", // Free plan
          });
        }
      }
    }
  }

  // URL to redirect to after sign in process completes (with locale)
  return NextResponse.redirect(`${origin}/${locale}/auth/success`);
}
