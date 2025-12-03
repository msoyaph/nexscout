export interface TemplateContext {
  subject?: string;
  body: string;
  title?: string;
  user?: {
    full_name?: string | null;
    first_name?: string | null;
    email?: string | null;
    locale?: string | null;
  } | null;
  context?: Record<string, any>;
}

export interface RenderedTemplate {
  subject?: string;
  title?: string;
  body: string;
}

function interpolate(template: string, vars: Record<string, any>): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    const path = key.split('.');
    let value: any = vars;

    for (const p of path) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return '';
      }
    }

    return value == null ? '' : String(value);
  });
}

export function renderEmailTemplate(input: TemplateContext): RenderedTemplate {
  const firstName =
    input.user?.first_name ||
    (input.user?.full_name ? input.user.full_name.split(' ')[0] : 'Ka-Scout');

  const vars = {
    user: input.user || {},
    context: input.context || {},
    firstName,
    name: input.user?.full_name || firstName
  };

  const subject = input.subject ? interpolate(input.subject, vars) : undefined;
  const body = interpolate(input.body, vars);

  return { subject, body };
}

export function renderPushTemplate(input: TemplateContext): RenderedTemplate {
  const firstName =
    input.user?.first_name ||
    (input.user?.full_name ? input.user.full_name.split(' ')[0] : 'Ka-Scout');

  const vars = {
    user: input.user || {},
    context: input.context || {},
    firstName,
    name: input.user?.full_name || firstName
  };

  const title = input.title ? interpolate(input.title, vars) : undefined;
  const body = interpolate(input.body, vars);

  return { title, body };
}

export function renderMentorTemplate(input: TemplateContext): RenderedTemplate {
  const firstName =
    input.user?.first_name ||
    (input.user?.full_name ? input.user.full_name.split(' ')[0] : 'Ka-Scout');

  const vars = {
    user: input.user || {},
    context: input.context || {},
    firstName,
    name: input.user?.full_name || firstName
  };

  const body = interpolate(input.body, vars);

  return { body };
}

export function renderTemplate(
  channel: 'email' | 'push' | 'mentor' | 'sms',
  input: TemplateContext
): RenderedTemplate {
  switch (channel) {
    case 'email':
      return renderEmailTemplate(input);
    case 'push':
      return renderPushTemplate(input);
    case 'mentor':
      return renderMentorTemplate(input);
    case 'sms':
      return renderPushTemplate(input);
    default:
      return { body: input.body };
  }
}
