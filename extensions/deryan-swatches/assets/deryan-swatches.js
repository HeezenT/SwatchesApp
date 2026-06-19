(() => {
  if (customElements.get('deryan-variant-swatches')) return;

  class DeryanVariantSwatches extends HTMLElement {
    connectedCallback() {
      const json = this.querySelector('[data-product-json]');
      this.abortController = new AbortController();
      this.helperMap = new Map();
      this.tooltipMap = new Map();
      this.addEventListener('click', this.onClick.bind(this), {
        signal: this.abortController.signal,
      });

      if (!json) {
        this.placeInProductDetails();
        this.hideNativeVariantPicker();
        this.renderMappedTooltips();
        return;
      }

      this.product = JSON.parse(json.textContent || '{}');
      this.variants = Array.isArray(this.product.variants) ? this.product.variants : [];
      this.fieldsets = Array.from(this.querySelectorAll('[data-option-index]'));
      this.helperMap = this.parseLineMap('[data-helper-map]', 3);
      this.tooltipMap = this.parseLineMap('[data-tooltip-map]', 2);
      this.updateRequestId = 0;

      this.addEventListener('change', this.onOptionChange.bind(this), {
        signal: this.abortController.signal,
      });

      this.placeInProductDetails();
      this.hideNativeVariantPicker();
      this.renderMappedTooltips();
      this.updateAvailability();
      this.syncSelection(false);
    }

    disconnectedCallback() {
      this.abortController?.abort();
    }

    onOptionChange(event) {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.matches('[data-option-input]')) return;
      if (input.disabled || input.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
        return;
      }

      input.checked = true;
      this.updateSelectedLabels();
      this.updateAvailability();
      this.syncSelection(true, input);
    }

    onClick(event) {
      const infoButton = event.target.closest?.('.deryan-swatches__info');
      if (!infoButton) return;

      event.preventDefault();
      const isOpen = infoButton.dataset.open === 'true';

      this.querySelectorAll('.deryan-swatches__info[data-open="true"]').forEach((button) => {
        if (button !== infoButton) button.dataset.open = 'false';
      });

      infoButton.dataset.open = String(!isOpen);
    }

    selectedOptions() {
      return this.fieldsets.map((fieldset) => {
        return fieldset.querySelector('[data-option-input]:checked')?.value || '';
      });
    }

    selectedOptionIds() {
      return this.fieldsets.map((fieldset) => {
        return fieldset.querySelector('[data-option-input]:checked')?.dataset.optionValueId || '';
      });
    }

    findVariant(options = this.selectedOptions()) {
      return this.variants.find((variant) => {
        return variant.options.every((value, index) => value === options[index]);
      });
    }

    async syncSelection(shouldUpdateUrl, sourceInput = this.querySelector('[data-option-input]:checked')) {
      const variant = this.findVariant();
      const requestId = ++this.updateRequestId;

      this.updateSelectedLabels();
      this.updateProductForms(variant);
      this.updateAddButtons(variant);

      if (!variant) return;

      if (shouldUpdateUrl) this.updateUrl(variant);

      const sourceId = sourceInput instanceof HTMLInputElement ? sourceInput.dataset.optionValueId || '' : '';

      this.dispatchEvent(
        new CustomEvent('variant:selected', {
          bubbles: true,
          detail: {
            resource: {
              id: sourceId,
            },
          },
        })
      );

      const html = await this.fetchUpdatedSection(variant);
      if (requestId !== this.updateRequestId) return;

      this.dispatchEvent(
        new CustomEvent('variant:update', {
          bubbles: true,
          detail: {
            resource: variant,
            sourceId,
            data: {
              html,
              productId: String(this.dataset.productId || this.product.productId || ''),
              newProduct: undefined,
            },
          },
        })
      );

      this.dispatchEvent(
        new CustomEvent('variant:change', {
          bubbles: true,
          detail: {
            variant,
            selectedOptions: this.selectedOptions(),
            selectedOptionIds: this.selectedOptionIds(),
            productId: this.dataset.productId || this.product.productId,
          },
        })
      );
    }

    updateSelectedLabels() {
      this.fieldsets.forEach((fieldset) => {
        const selected = fieldset.querySelector('[data-option-input]:checked');
        const label = fieldset.querySelector('[data-selected-value]');
        if (selected && label) label.textContent = this.helperTextFor(fieldset, selected);
      });
    }

    updateAvailability() {
      const selected = this.selectedOptions();

      this.fieldsets.forEach((fieldset, optionIndex) => {
        const inputs = Array.from(fieldset.querySelectorAll('[data-option-input]'));

        inputs.forEach((input) => {
          const candidateOptions = [...selected];
          candidateOptions[optionIndex] = input.value;

          const matchingVariant = this.findVariant(candidateOptions);
          const isAvailable = Boolean(matchingVariant?.available);

          input.dataset.optionAvailable = String(isAvailable);
          input.disabled = !isAvailable;
          input.setAttribute('aria-disabled', String(!isAvailable));

          const labelText = input.value + (isAvailable ? '' : ' - Sold out');
          input.setAttribute('aria-label', labelText);
        });
      });
    }

    helperTextFor(fieldset, selectedInput) {
      const staticHelper = fieldset.dataset.staticHelper?.trim();
      if (staticHelper) return staticHelper;

      const metafieldHelper = selectedInput.dataset.helperText?.trim();
      if (metafieldHelper) return metafieldHelper;

      const optionName = fieldset.dataset.optionName || '';
      const exactHelper = this.helperMap.get(`${optionName}::${selectedInput.value}`);
      const wildcardHelper = this.helperMap.get(`${optionName}::*`);

      return exactHelper || wildcardHelper || selectedInput.value;
    }

    parseLineMap(selector, expectedParts) {
      const script = this.querySelector(selector);
      const map = new Map();
      if (!script) return map;

      let raw = '';

      try {
        raw = JSON.parse(script.textContent || '""') || '';
      } catch (_error) {
        raw = script.textContent || '';
      }

      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          const parts = line.split('|').map((part) => part.trim());
          if (parts.length < expectedParts) return;

          if (expectedParts === 3) {
            const [optionName, optionValue, helper] = parts;
            if (optionName && optionValue && helper) map.set(`${optionName}::${optionValue}`, helper);
          } else {
            const [optionName, tooltip] = parts;
            if (optionName && tooltip) map.set(optionName, tooltip);
          }
        });

      return map;
    }

    renderMappedTooltips() {
      this.fieldsets.forEach((fieldset) => {
        const optionName = fieldset.dataset.optionName;
        const tooltip = fieldset.dataset.tooltipText?.trim() || this.tooltipMap.get(optionName);
        const heading = fieldset.querySelector('.deryan-swatches__option-heading');

        if (!tooltip || !heading || heading.querySelector('.deryan-swatches__info')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'deryan-swatches__info';
        button.setAttribute('aria-label', 'Meer informatie');
        button.textContent = 'i';

        const bubble = document.createElement('span');
        bubble.className = 'deryan-swatches__tooltip';
        bubble.setAttribute('role', 'tooltip');
        bubble.textContent = tooltip;

        button.appendChild(bubble);
        heading.appendChild(button);
      });
    }

    updateProductForms(variant) {
      const forms = this.productForms();

      forms.forEach((form) => {
        const variantInputs = form.querySelectorAll('input[name="id"], select[name="id"]');

        variantInputs.forEach((input) => {
          if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
            input.value = variant?.id ? String(variant.id) : '';
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    }

    updateAddButtons(variant) {
      const available = Boolean(variant?.available);

      this.productForms().forEach((form) => {
        form.querySelectorAll('button[name="add"], [type="submit"]').forEach((button) => {
          if (button instanceof HTMLButtonElement) button.disabled = !available;
        });
      });
    }

    productForms() {
      const section = this.closest('.shopify-section') || document;
      const forms = new Set();

      section.querySelectorAll('form[action*="/cart/add"], product-form-component form').forEach((form) => {
        if (form instanceof HTMLFormElement) forms.add(form);
      });

      document.querySelectorAll(`form[action*="/cart/add"] [name="id"][value="${this.product.selectedVariantId}"]`).forEach((input) => {
        const form = input.closest('form');
        if (form instanceof HTMLFormElement) forms.add(form);
      });

      return Array.from(forms);
    }

    updateUrl(variant) {
      if (!variant?.id) return;

      const url = new URL(window.location.href);
      url.searchParams.set('variant', String(variant.id));
      url.searchParams.delete('option_values');
      window.history.replaceState({}, '', url.toString());
    }

    async fetchUpdatedSection(variant) {
      const sectionId = this.dataset.sectionId;
      const productUrl = this.dataset.productUrl || this.product.productUrl || window.location.pathname;

      if (!sectionId || !variant?.id) return document;

      const url = new URL(productUrl, window.location.origin);
      url.searchParams.set('variant', String(variant.id));
      url.searchParams.set('section_id', sectionId);

      try {
        const response = await fetch(url.toString(), {
          headers: {
            Accept: 'text/html',
          },
        });

        const text = await response.text();
        return new DOMParser().parseFromString(text, 'text/html');
      } catch (error) {
        return document;
      }
    }

    hideNativeVariantPicker() {
      if (this.dataset.hideNativePicker !== 'true') return;

      const section = this.closest('.shopify-section');
      if (!section) return;

      section.querySelectorAll('variant-picker, .variant-picker').forEach((picker) => {
        if (!picker.closest('deryan-variant-swatches')) picker.setAttribute('hidden', 'true');
      });
    }

    placeInProductDetails() {
      const section = this.closest('.shopify-section');
      if (!section) return;

      const nativePicker = section.querySelector('variant-picker, .variant-picker');
      const appWrapper = this.closest('.shopify-app-block');
      const productDetails = section.querySelector('[data-testid="product-information-details"], .product-details');
      const detailsContent = productDetails?.querySelector('.group-block-content') || productDetails;

      if (!appWrapper || !detailsContent || nativePicker?.closest('deryan-variant-swatches')) return;

      const insertionTarget =
        nativePicker ||
        detailsContent.querySelector('.buy-buttons-block, product-form-component, form[action*="/cart/add"]');

      if (insertionTarget && insertionTarget.parentElement) {
        if (appWrapper.parentElement === insertionTarget.parentElement && appWrapper.nextElementSibling === insertionTarget) return;
        insertionTarget.parentElement.insertBefore(appWrapper, insertionTarget);
        appWrapper.dataset.deryanPlacement = 'product-details';
        return;
      }

      if (appWrapper.parentElement !== detailsContent) {
        detailsContent.appendChild(appWrapper);
        appWrapper.dataset.deryanPlacement = 'product-details';
      }
    }
  }

  customElements.define('deryan-variant-swatches', DeryanVariantSwatches);
})();
