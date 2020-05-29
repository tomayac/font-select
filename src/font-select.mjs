/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @license © 2020 Google LLC. Licensed under the Apache License, Version 2.0.

// See https://html.spec.whatwg.org/multipage/common-dom-interfaces.html ↵
// #reflecting-content-attributes-in-idl-attributes.
const installStringReflection = (obj, attrName, propName = attrName) => {
  Object.defineProperty(obj, propName, {
    enumerable: true,
    get() {
      const value = this.getAttribute(attrName);
      return value === null ? '' : value;
    },
    set(v) {
      this.setAttribute(attrName, v);
    },
  });
};

const installBoolReflection = (obj, attrName, propName = attrName) => {
  Object.defineProperty(obj, propName, {
    enumerable: true,
    get() {
      return this.hasAttribute(attrName);
    },
    set(v) {
      if (v) {
        this.setAttribute(attrName, '');
      } else {
        this.removeAttribute(attrName);
      }
    },
  });
};

// Attributes
const AUTOFOCUS = 'autofocus';
const MULTIPLE = 'multiple';
const VALUE = 'value';
const DISABLED = 'disabled';

// UI strings
const REGULAR = 'Regular';
const FONT_FAMILY = 'Font Family';
const FONT_FAMILIES = 'Font Families';
const FONT_VARIATION = 'Font Variation';

// Other strings
const OPTION = 'option';
const OPTGROUP = 'optgroup';
const LI = 'li';
const SELECT = 'select';
const UL = 'ul';
const BUTTON = 'button'
const INPUT = 'input';
const HIGHLIGHT = 'highlight';
const CHANGE = 'change';
const GRANTED = 'granted';
const LOCAL_FONTS = 'local-fonts';
const NONE = 'none';
const BLOCK = 'block';
const TYPE_ERROR = 'TypeError';
const ARIA_EXPANDED = 'aria-expanded';
const ARIA_SELECTED = 'aria-selected';
const ARIA_ACTIVEDESCENDENT = 'aria-activedescendant';

// Keys
const ARROW_DOWN = 'ArrowDown';
const ARROW_UP = 'ArrowUp';
const ESCAPE = 'Escape';
const ENTER = 'Enter';
const NUMPAD_ENTER = 'NumpadEnter';

// Uglify
const DOCUMENT = document;
const NAVIGATOR = navigator;
const PERMISSIONS = NAVIGATOR.permissions;

const template = DOCUMENT.createElement('template');
template.innerHTML = `
  <style>
    *,
    ::before,
    ::after {
      box-sizing: border-box;
    }

    :host {
      color-scheme: dark light;
      contain: content;
      display: block;

      --input-height: 25px;
      --autocomplete-max-height: 10rem;
      --element-height: calc(var(--input-height) + var(--autocomplete-max-height));
      height: var(--input-height);
      max-height: var(--input-height);
      overflow: visible;
    }

    :host([hidden]) {
      display: none;
    }

    optgroup[disabled] {
      display: none;
    }

    ul {
      color: WindowText;
      background-color: Window;
      position: absolute;
      top: var(--input-height);
      left: 0;
      margin: 0;
      list-style: none;
      padding-inline-start: 4px;
      margin-block: 0;
      overflow-y: scroll;
      max-height: var(--autocomplete-max-height);
      max-width: 100%;
      width: max-content;
      border: solid 1px FieldText;
    }

    li {
      user-select: none;
      cursor: default;
    }

    input,
    button {
      height: var(--input-height);
    }

    button[aria-expanded=true]::before {
      content: "<";
    }

    button[aria-expanded=false]::before {
      content: ">";
    }

    div[part=container] {
      display: inline-flex;
    }

    .wrapper {
      position: absolute;
    }

    .highlight {
      background-color: Highlight;
    }
  </style>

  <div class="wrapper" style="outline: solid 1px green">
    <div part="container" style="outline: solid 1px red">
      <div part="font-family">
        <input part="font-family-input" id="family" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="autocomplete">
        <button tabindex="-1" aria-label="${FONT_FAMILIES}" aria-expanded="false" aria-controls="autocomplete"></button>
        <label part="font-family-label" for="family">${FONT_FAMILY}</label>
      </div>
      <div part="font-variation">
        <select part="font-variation-select" id="variation"></select>
        <label part="font-variation-label" for="variation">${FONT_VARIATION}</label>
      </div>
    </div>
    <ul style="border:solid 1px blue" id="autocomplete" role="listbox" aria-label="${FONT_FAMILIES}"></ul>
  </div>`;

export class FontSelect extends HTMLElement {
  static get observedAttributes() {
    return [AUTOFOCUS, MULTIPLE, DISABLED, VALUE];
  }

  constructor() {
    super();
    installBoolReflection(this, DISABLED);
    installBoolReflection(this, MULTIPLE);
    installBoolReflection(this, AUTOFOCUS);
    installStringReflection(this, VALUE);

    this._initializeDOM();
  }

  async _requestPermission() {
    try {
      if ((await PERMISSIONS.request({name: LOCAL_FONTS})).state !== GRANTED) {
        return false;
      }
      return true;
    } catch (err) {
      this._throwIfNotTypeError(err);
    }
  }

  _throwIfNotTypeError(err) {
    if (err.name !== TYPE_ERROR) {
      throw err;
    }
  }

  _filterFontPreview(value, exactMatch = false) {
    const lowerCaseValue = value.toLowerCase();
    let hasMatches = false;
    this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
      const matches = exactMatch
        ? fontPreviewItem.textContent.toLowerCase() === lowerCaseValue
        : fontPreviewItem.textContent.toLowerCase().includes(lowerCaseValue);
      if (matches) {
        hasMatches = true;
        return (fontPreviewItem.style.display = BLOCK);
      }
      fontPreviewItem.style.display = NONE;
    });
    if (!hasMatches) {
      this._hideFontPreview();
    }
  }

  _showFontPreview() {
    if (!this._fontPreviewList.fontPreviewItems) {
      return;
    }
    this._index = -1;
    this.style.height = 'var(--element-height)';
    this._fontFamilyInput.setAttribute(ARIA_EXPANDED, true);
    this._fontFamilyButton.setAttribute(ARIA_EXPANDED, true);
    this._fontPreviewList.style.display = BLOCK;
    this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
      fontPreviewItem.style.display = BLOCK;
      fontPreviewItem.classList.remove(HIGHLIGHT);
    });
  }

  _hideFontPreview() {
    this._index = -1;
    this.style.height = 'var(--input-height)';
    this._fontFamilyInput.setAttribute(ARIA_EXPANDED, false);
    this._fontFamilyButton.setAttribute(ARIA_EXPANDED, false);
    this._fontPreviewList.style.display = NONE;
    this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
      fontPreviewItem.style.display = NONE;
      fontPreviewItem.classList.remove(HIGHLIGHT);
    });
  }

  _getVisibleFontPreviewItems() {
    return this._fontPreviewList.fontPreviewItems.filter((fontPreviewItem) => {
      return fontPreviewItem.style.display !== NONE;
    });
  }

  async _initializeDOM() {
    this._index = -1;
    this._hover = false;

    this._shadowRoot = this.attachShadow({mode: 'closed'});
    this._shadowRoot.appendChild(template.content.cloneNode(true));

    this._fontVariationSelect = this._shadowRoot.querySelector(SELECT);
    this._fontFamilyInput = this._shadowRoot.querySelector(INPUT);
    this._fontFamilyButton = this._shadowRoot.querySelector(BUTTON);
    this._fontPreviewList = this._shadowRoot.querySelector(UL);

    this._fontVariationSelect.multiple = this.multiple;
    this._fontVariationSelect.disabled = true;

    if (!('fonts' in NAVIGATOR)) {
      return;
    }

    this._fontFamilyButton.addEventListener('click', () => {
      if (this._fontFamilyButton.getAttribute(ARIA_EXPANDED) === 'false') {
        return this._fontFamilyInput.focus();
      }
      this._hideFontPreview();
    });

    this._fontFamilyInput.addEventListener('focus', async () => {
      try {
        if ((await PERMISSIONS.query({name: LOCAL_FONTS})).state !== GRANTED) {
          this._fontVariationSelect.disabled = await this._requestPermission();
        }
      } catch (err) {
        this._throwIfNotTypeError(err);
      }
      this._showFontPreview();
    });

    this._fontFamilyInput.addEventListener('blur', () => {
      if (!this._hover) {
        this._hideFontPreview();
      }
    });

    this._fontPreviewList.addEventListener('pointerdown', (e) => {
      const clickedFontPreviewItem = e.target;
      if (clickedFontPreviewItem.nodeName.toLowerCase() !== LI) {
        return;
      }
      clickedFontPreviewItem.setAttribute(ARIA_SELECTED, true);
      this._fontFamilyInput.value = clickedFontPreviewItem.textContent;
      this._fontFamilyInput.dispatchEvent(new Event(INPUT));
      this._fontFamilyInput.dispatchEvent(new Event(CHANGE));
      this._hideFontPreview();
    });

    this._fontPreviewList.addEventListener('pointerout', (e) => {
      this._hover = false;
    });

    this._fontPreviewList.addEventListener('pointerover', (e) => {
      this._hover = true;
      const hoveredFontPreviewItem = e.target;
      if (hoveredFontPreviewItem.nodeName.toLowerCase() !== LI) {
        return;
      }
      const visibleFontPreviewItems = this._getVisibleFontPreviewItems();
      this._fontFamilyInput.removeAttribute(ARIA_ACTIVEDESCENDENT);
      visibleFontPreviewItems.forEach((fontPreviewItem, i) => {
        if (fontPreviewItem === hoveredFontPreviewItem) {
          this._index = i;
          this._fontFamilyInput.setAttribute(ARIA_ACTIVEDESCENDENT, fontPreviewItem.textContent);
          return fontPreviewItem.classList.add(HIGHLIGHT);
        }
        fontPreviewItem.classList.remove(HIGHLIGHT);
      });
    });

    this._fontFamilyInput.addEventListener('keydown', (e) => {
      const code = e.code;
      const allowed = [ARROW_DOWN, ARROW_UP, ESCAPE, ENTER, NUMPAD_ENTER];
      if (!allowed.includes(code)) {
        return;
      }
      e.preventDefault();
      if (code === ESCAPE) {
        this._fontFamilyInput.focus();
        if (this._fontFamilyInput.getAttribute(ARIA_EXPANDED === 'true')) {
          return this._hideFontPreview();
        }
        return this._fontFamilyInput.value = '';
      }
      const visibleFontPreviewItems = this._getVisibleFontPreviewItems();
      if (code === ENTER || code === NUMPAD_ENTER) {
        if (visibleFontPreviewItems[this._index]) {
          visibleFontPreviewItems[this._index].setAttribute(ARIA_SELECTED, true);
          this._fontFamilyInput.value =
            visibleFontPreviewItems[this._index].textContent;
        }
        this._fontFamilyInput.dispatchEvent(new Event(INPUT));
        this._fontFamilyInput.dispatchEvent(new Event(CHANGE));
        return this._hideFontPreview();
      }
      const numVisible = visibleFontPreviewItems.length;
      this._hover = false;
      if (code === ARROW_DOWN) {
        this._index = ++this._index % numVisible;
      } else {
        this._index = this._index > 0 ? --this._index : numVisible - 1;
      }
      this._fontFamilyInput.removeAttribute(ARIA_ACTIVEDESCENDENT);
      visibleFontPreviewItems.forEach((fontPreviewItem, i) => {
        if (this._index === i) {
          fontPreviewItem.scrollIntoView({block: 'nearest'});
          this._fontFamilyInput.setAttribute(ARIA_ACTIVEDESCENDENT, fontPreviewItem.textContent);
          return fontPreviewItem.classList.add(HIGHLIGHT);
        }
        fontPreviewItem.classList.remove(HIGHLIGHT);
      });
    });

    this._fontFamilyInput.addEventListener(INPUT, () => {
      const value = this._fontFamilyInput.value;
      this._fontVariationSelect.selectedIndex = -1;
      if (!value) {
        this._showFontPreview();
        this._fontVariationSelect.optgroups.forEach((optgroup) => {
          optgroup.disabled = true;
        });
        return (this._fontVariationSelect.disabled = true);
      }
      this._filterFontPreview(value);
      this._fontVariationSelect.optgroups.forEach((optgroup) => {
        if (optgroup.label === value) {
          optgroup.disabled = false;
          optgroup.firstChild.selected = true;
        } else {
          optgroup.disabled = true;
        }
      });
    });

    this._fontFamilyInput.addEventListener(CHANGE, () => {
      const value = this._fontFamilyInput.value;
      if (!Object.keys(fonts).includes(value)) {
        this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
          fontPreviewItem.setAttribute(ARIA_SELECTED, false);
        })
        return (this._fontFamilyInput.value = '');
      }
      this._filterFontPreview(value, true);
      this._fontVariationSelect.disabled = false;

      if (
        this._fontVariationSelect.selectedOptions[0].parentElement
          .childElementCount > 1
      ) {
        this._fontVariationSelect.focus();
      }
      this._fontVariationSelect.dispatchEvent(new Event(CHANGE));
    });

    this._fontVariationSelect.addEventListener(CHANGE, () => {
      if (!this._fontVariationSelect.selectedOptions.length) {
        return;
      }
      this.value = this._fontVariationSelect.selectedOptions[0].value;
      this.selectedOptions = this._fontVariationSelect.selectedOptions;
      this.dispatchEvent(
        new CustomEvent(CHANGE, {
          detail: this._fontVariationSelect.selectedOptions,
        })
      );
    });

    const fonts = {};
    const styleSheet = new CSSStyleSheet();
    for await (const metadata of NAVIGATOR.fonts.query()) {
      if (!fonts[metadata.family]) {
        fonts[metadata.family] = [];
      }
      fonts[metadata.family].push(metadata);
    }
    Object.keys(fonts)
      .sort()
      .forEach((fontFamily) => {
        const optgroup = DOCUMENT.createElement(OPTGROUP);
        optgroup.label = fontFamily;
        optgroup.disabled = true;
        const li = DOCUMENT.createElement(LI);
        li.role = OPTION;
        li.textContent = fontFamily;
        li.style.fontFamily = fontFamily;
        this._fontPreviewList.append(li);
        fonts[fontFamily]
          .map((font) => {
            // Replace font variation name "Arial" with "Arial Regular".
            const variationName = font.fullName.replace(fontFamily, '').trim();
            font.variationName = variationName ? variationName : REGULAR;
            return font;
          })
          .sort((a, b) => {
            // "Regular" always comes first, else use alphabetic order.
            if (a.variationName === REGULAR) {
              return -1;
            } else if (b.variationName === REGULAR) {
              return 1;
            } else if (a.variationName < b.variationName) {
              return -1;
            } else if (a.variationName > b.variationName) {
              return 1;
            }
            return 0;
          })
          .forEach((font) => {
            const option = DOCUMENT.createElement(OPTION);
            option.text = font.variationName;
            option.value = font.fullName;
            option.dataset.postscriptName = font.postscriptName;
            optgroup.append(option);

            styleSheet.insertRule(`
          @font-face {
            font-family: '${font.fullName}';
            src: local('${font.fullName}'),
                 local('${font.postscriptName}');
          }`);
          });
        this._fontVariationSelect.append(optgroup);
      });
    this._fontVariationSelect.optgroups = this._fontVariationSelect.querySelectorAll(
      OPTGROUP
    );
    this._fontPreviewList.fontPreviewItems = Array.from(
      this._fontPreviewList.querySelectorAll(LI)
    );
    DOCUMENT.adoptedStyleSheets = [...DOCUMENT.adoptedStyleSheets, styleSheet];
    // ficken
    const {x, y, width, height} = this.getBoundingClientRect();
    const spacer = DOCUMENT.createElement('div');
    spacer.style.backgroundColor = 'yellow';
    spacer.style.width = `${width}px`;
    spacer.style.height = `${height}px`;
    spacer.style.left = `${x}px`;
    spacer.style.top = `${y}px`;
    this._shadowRoot.querySelector('.wrapper').insertAdjacentElement('afterend', spacer);
    this._fontFamilyInput.disabled = this.disabled ? true : false;
    if (this.autofocus) {
     // this._fontFamilyInput.focus();
    }
    this._shadowRoot.adoptedStyleSheets = [styleSheet];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === AUTOFOCUS) {
      if (this.autofocus) {
        this._fontFamilyInput.focus();
      }
    } else if (name === DISABLED) {
      this._fontFamilyInput.disabled = this.disabled;
      this._fontVariationSelect.disabled = this.disabled;
    }
  }
}

customElements.define('font-select', FontSelect);
