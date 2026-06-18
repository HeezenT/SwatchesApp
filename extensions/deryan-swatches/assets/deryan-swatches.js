(() => {
  if (customElements.get('deryan-variant-swatches')) return;

  class DeryanVariantSwatches extends HTMLElement {
    connectedCallback() {
      const json = this.querySelector('[data-product-json]');
      if (!json) {
        this.placeInProductDetails();
        this.hideNativeVariantPicker();
        return;
      }

      this.product = JSON.parse(json.textContent || '{}');
      this.variants = Array.isArray(this.product.variants) ? this.product.variants : [];
      this.fieldsets = Array.from(this.querySelectorAll('[data-option-index]'));
      this.abortController = new AbortController();

      this.addEventListener('change', this.onOptionChange.bind(this), {
        signal: this.abortController.signal,
      });

      this.placeInProductDetails();
      this.hideNativeVariantPicker();
      this.updateAvailability();
      this.syncSelection(false);
    }

    disconnectedCallback() {
      this.abortController?.abort();
    }

    onOptionChange(event) {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.matches('[data-option-input]')) return;

      input.checked = true;
      this.updateSelectedLabels();
      this.updateAvailability();
      this.syncSelection(true, input);
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
        if (selected && label) label.textContent = selected.value;
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
          input.setAttribute('aria-disabled', String(!isAvailable));

          const labelText = input.value + (isAvailable ? '' : ' - Sold out');
          input.setAttribute('aria-label', labelText);
        });
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
        console.warn('Deryan swatches could not fetch the updated product section.', error);
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
