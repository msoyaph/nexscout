export interface DetectedFormField {
  name?: string;
  label?: string;
  placeholder?: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'hidden' | 'password' | 'unknown';
  required: boolean;
}

export interface DetectedForm {
  id?: string;
  pageUrl: string;
  formType: 'lead_capture' | 'contact' | 'newsletter' | 'login' | 'checkout' | 'other';
  ctaText: string;
  fields: DetectedFormField[];
  formAction?: string;
  formMethod?: string;
  complexityScore: number;
  barrierScore: number;
}

export interface FormDetectionInput {
  html: string;
  url: string;
}

export interface LeadFlowNode {
  pageUrl: string;
  nodeType: 'info' | 'lead_form' | 'join_form' | 'checkout';
  description: string;
}

export interface LeadFlowEdge {
  fromUrl: string;
  toUrl: string;
  viaCtaText: string;
}

export interface LeadFlow {
  nodes: LeadFlowNode[];
  edges: LeadFlowEdge[];
}

class FormDetectionService {
  /**
   * Detect all forms on a page
   */
  async detectForms(input: FormDetectionInput): Promise<DetectedForm[]> {
    const forms: DetectedForm[] = [];

    // Extract all form elements from HTML
    const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    let formMatch;
    let formIndex = 0;

    while ((formMatch = formRegex.exec(input.html)) !== null) {
      formIndex++;
      const formHtml = formMatch[0];
      const formContent = formMatch[1];

      // Extract form attributes
      const actionMatch = formHtml.match(/action=["']([^"']*)["']/i);
      const methodMatch = formHtml.match(/method=["']([^"']*)["']/i);

      const formAction = actionMatch ? actionMatch[1] : undefined;
      const formMethod = methodMatch ? methodMatch[1] : 'POST';

      // Extract form ID
      const idMatch = formHtml.match(/id=["']([^"']*)["']/i);
      const formId = idMatch ? idMatch[1] : `form_${formIndex}`;

      // Extract fields
      const fields = this.extractFields(formContent);

      // Extract CTA text (button or heading near form)
      const ctaText = this.extractCtaText(formContent, formHtml);

      // Classify form type
      const formType = this.classifyFormType(ctaText, fields, formContent);

      // Calculate complexity and barrier scores
      const complexityScore = this.calculateComplexity(fields);
      const barrierScore = this.calculateBarrier(fields, formType);

      forms.push({
        id: formId,
        pageUrl: input.url,
        formType,
        ctaText,
        fields,
        formAction,
        formMethod,
        complexityScore,
        barrierScore,
      });
    }

    return forms;
  }

  /**
   * Extract form fields from HTML
   */
  private extractFields(html: string): DetectedFormField[] {
    const fields: DetectedFormField[] = [];

    // Extract input fields
    const inputRegex = /<input[^>]*>/gi;
    let inputMatch;

    while ((inputMatch = inputRegex.exec(html)) !== null) {
      const inputHtml = inputMatch[0];

      const nameMatch = inputHtml.match(/name=["']([^"']*)["']/i);
      const typeMatch = inputHtml.match(/type=["']([^"']*)["']/i);
      const placeholderMatch = inputHtml.match(/placeholder=["']([^"']*)["']/i);
      const requiredMatch = inputHtml.match(/required/i);

      const fieldType = typeMatch ? this.normalizeFieldType(typeMatch[1]) : 'text';

      // Skip hidden and submit buttons
      if (fieldType === 'hidden' || fieldType === 'unknown') {
        continue;
      }

      fields.push({
        name: nameMatch ? nameMatch[1] : undefined,
        type: fieldType,
        placeholder: placeholderMatch ? placeholderMatch[1] : undefined,
        required: !!requiredMatch,
      });
    }

    // Extract textarea fields
    const textareaRegex = /<textarea[^>]*>(.*?)<\/textarea>/gi;
    let textareaMatch;

    while ((textareaMatch = textareaRegex.exec(html)) !== null) {
      const textareaHtml = textareaMatch[0];

      const nameMatch = textareaHtml.match(/name=["']([^"']*)["']/i);
      const requiredMatch = textareaHtml.match(/required/i);

      fields.push({
        name: nameMatch ? nameMatch[1] : undefined,
        type: 'textarea',
        required: !!requiredMatch,
      });
    }

    // Extract select fields
    const selectRegex = /<select[^>]*>[\s\S]*?<\/select>/gi;
    let selectMatch;

    while ((selectMatch = selectRegex.exec(html)) !== null) {
      const selectHtml = selectMatch[0];

      const nameMatch = selectHtml.match(/name=["']([^"']*)["']/i);
      const requiredMatch = selectHtml.match(/required/i);

      fields.push({
        name: nameMatch ? nameMatch[1] : undefined,
        type: 'select',
        required: !!requiredMatch,
      });
    }

    return fields;
  }

  /**
   * Normalize field type to standard types
   */
  private normalizeFieldType(type: string): DetectedFormField['type'] {
    const normalized = type.toLowerCase();

    switch (normalized) {
      case 'text':
      case 'email':
      case 'tel':
      case 'phone':
        return normalized === 'tel' ? 'phone' : normalized as DetectedFormField['type'];
      case 'password':
        return 'password';
      case 'checkbox':
        return 'checkbox';
      case 'radio':
        return 'radio';
      case 'hidden':
        return 'hidden';
      default:
        return 'text';
    }
  }

  /**
   * Extract CTA text from form
   */
  private extractCtaText(formContent: string, formHtml: string): string {
    // Look for button text
    const buttonMatch = formContent.match(/<button[^>]*>([^<]+)<\/button>/i);
    if (buttonMatch) {
      return buttonMatch[1].trim();
    }

    // Look for submit input value
    const submitMatch = formContent.match(/<input[^>]*type=["']submit["'][^>]*value=["']([^"']*)["']/i);
    if (submitMatch) {
      return submitMatch[1].trim();
    }

    // Look for heading before form
    const precedingHtml = formHtml.substring(Math.max(0, formHtml.indexOf('<form') - 500), formHtml.indexOf('<form'));
    const headingMatch = precedingHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    return 'Submit';
  }

  /**
   * Classify form type based on content and fields
   */
  private classifyFormType(ctaText: string, fields: DetectedFormField[], html: string): DetectedForm['formType'] {
    const lowerCta = ctaText.toLowerCase();
    const lowerHtml = html.toLowerCase();

    // Lead capture / join form
    if (lowerCta.match(/join|sign\s*up|register|enroll|become|start|get\s*started|distributor|member/)) {
      return 'lead_capture';
    }

    // Login form
    if (lowerCta.match(/log\s*in|sign\s*in|login/) || fields.some(f => f.type === 'password')) {
      return 'login';
    }

    // Checkout form
    if (lowerCta.match(/checkout|purchase|buy|order|pay/) || lowerHtml.includes('billing')) {
      return 'checkout';
    }

    // Newsletter
    if (lowerCta.match(/subscribe|newsletter/) && fields.length <= 2) {
      return 'newsletter';
    }

    // Contact form
    if (lowerCta.match(/contact|send|message|inquiry/) || fields.some(f => f.type === 'textarea')) {
      return 'contact';
    }

    return 'other';
  }

  /**
   * Calculate form complexity score (0-100)
   */
  private calculateComplexity(fields: DetectedFormField[]): number {
    let score = 0;

    // Base score on field count
    score += Math.min(fields.length * 5, 40);

    // Add for required fields
    const requiredCount = fields.filter(f => f.required).length;
    score += Math.min(requiredCount * 5, 30);

    // Add for special field types
    if (fields.some(f => f.type === 'password')) score += 10;
    if (fields.some(f => f.type === 'select')) score += 5;
    if (fields.some(f => f.type === 'textarea')) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate barrier to entry score (0-100)
   * Higher score = more barriers
   */
  private calculateBarrier(fields: DetectedFormField[], formType: DetectedForm['formType']): number {
    let score = 0;

    // Many fields = higher barrier
    if (fields.length > 10) score += 40;
    else if (fields.length > 5) score += 25;
    else if (fields.length > 3) score += 15;
    else score += 5;

    // Required fields = higher barrier
    const requiredCount = fields.filter(f => f.required).length;
    score += Math.min(requiredCount * 5, 30);

    // Form type specific barriers
    if (formType === 'checkout') score += 20;
    if (formType === 'lead_capture') score += 10;

    // Special field types
    if (fields.some(f => f.type === 'password')) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Map lead flow across multiple pages
   */
  buildLeadFlow(forms: DetectedForm[], pages: { url: string; html: string }[]): LeadFlow {
    const nodes: LeadFlowNode[] = [];
    const edges: LeadFlowEdge[] = [];

    // Create nodes for each form
    forms.forEach(form => {
      let nodeType: LeadFlowNode['nodeType'] = 'info';

      if (form.formType === 'lead_capture') {
        nodeType = 'join_form';
      } else if (form.formType === 'checkout') {
        nodeType = 'checkout';
      } else if (form.formType === 'contact') {
        nodeType = 'lead_form';
      }

      nodes.push({
        pageUrl: form.pageUrl,
        nodeType,
        description: `${form.formType} form: ${form.ctaText}`,
      });
    });

    // Create nodes for info pages (pages without forms)
    pages.forEach(page => {
      const hasForm = forms.some(f => f.pageUrl === page.url);
      if (!hasForm) {
        nodes.push({
          pageUrl: page.url,
          nodeType: 'info',
          description: 'Information page',
        });
      }
    });

    // Extract edges (links between pages)
    pages.forEach(page => {
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(page.html)) !== null) {
        try {
          const href = linkMatch[1];
          const linkText = linkMatch[2].trim();
          const targetUrl = new URL(href, page.url).href.replace(/#.*$/, '').replace(/\/$/, '');

          // Check if target exists in our nodes
          const targetExists = nodes.some(n => n.pageUrl.includes(targetUrl) || targetUrl.includes(n.pageUrl));

          if (targetExists && linkText) {
            edges.push({
              fromUrl: page.url,
              toUrl: targetUrl,
              viaCtaText: linkText,
            });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return { nodes, edges };
  }
}

export const formDetectionService = new FormDetectionService();
