/*!
 * jQuery lightweight accessible toggle plugin
 * Author: @gijsroge
 * Licensed under the MIT license
 */
(function ($) {

    var instance = 0;
    var state = [];
    var focusableElements = 'a[href]:visible, area[href]:visible, input:not([disabled]):visible, select:not([disabled]):visible, textarea:not([disabled]):visible, button:not([disabled]):visible, iframe:visible, object:visible, embed:visible, [contenteditable]:visible, [tabindex]:not([tabindex^="-"]):visible';

    $.fn.a11yToggle = function (options) {

        a11yToggle = this;
        a11yToggle.state = state;

        var app = {

            /**
             * Setup aria attributes and other html modifications
             * @param $this
             * @param i
             */
            prepareHtml: function ($this, i) {
                var $target = $this.parent().find(state[i].settings.target);
                var id = $this.attr('id') ? $this.attr('id') : 'a11y-toggle-' + i;
                $this.attr('data-a11y-instance', i);
                $this.attr('id', id);
                $this.attr('aria-expanded', false);
                if (!$this.is('[aria-controls]')) {
                    $this.attr('aria-controls', id + '-target');
                }
                $target.attr('aria-hidden', true);
                if (!$target.is('[id]')) {
                    $target.attr('id', id + '-target');
                }
                $target.attr('aria-labelledby', id);

                // Test if aria attributes are setup correctly
                if ($this.attr('aria-controls') != $target.attr('id') && state[i].settings.aria) {
                    console.warn('aria-controls must have the same value as the target id.');
                }
            },

            /**
             * Get custom settings/data for instance
             *
             * @param $this
             * @returns {*}
             */
            getState: function ($this) {
                var i = $this.attr('data-a11y-instance');
                return state[i];
            },

            /**
             * Bind all events to the dom
             *
             * @param $this
             * @param state
             */
            bindUIevents: function ($this, state) {

                state.$this.on('click', function (e) {
                    e.preventDefault();
                    if (state.open && !state.kb) {
                        a11yToggle.close($(this))
                    } else {
                        a11yToggle.open($(this))
                    }
                });

                /**
                 * Close when user clicks on close button
                 */
                state.close.on('click', function () {
                    a11yToggle.close($this);
                });

                /**
                 * Bind esc key to all instances and close all open instances when pressed.
                 */
                $(document).on('keydown', function (e) {
                    var state = app.getState($this);
                    if (e.keyCode === 27 && state.settings.escape) {
                        if (state.open) {
                            a11yToggle.close(state.$this);
                        }
                    }
                });

                /**
                 * Hide dropdowns when clicking outside toggle
                 */
                $(document).on('click', function (e) {
                    var state = app.getState($this);
                    if (!$(e.target).is($this) && !$this.find(e.target).length > 0 && !state.target.find(e.target).length > 0 && !$(e.target).is(state.target) && state.settings.outside) {
                        if (state.open) {
                            a11yToggle.close($this)
                        }
                    }
                })
            },

            openOnFocus: function ($this) {
                var state = app.getState($this);

                // All focusable elements
                // From: https://github.com/edenspiekermann/a11y-dialog/blob/master/a11y-dialog.js#L31
                var links = state.target.find(focusableElements);

                /**
                 * Bind focus event to toggles
                 */
                $this.on('focus', function () {
                    if (!state.open) {
                        a11yToggle.open($(this), true);
                    }
                });

                /**
                 * Bind keydown on toggle/dropdown items so we
                 * can open/close dropdown when user tabs on the element
                 */
                state.target.parent().on('keydown', function (e) {
                    if (e.which == 9) {
                        var item = $(e.target);

                        // Shift tab
                        if (e.shiftKey) {
                            if (item.is(state.$this)) {
                                a11yToggle.close($this);
                            }
                        } else {
                            if (item.is(links.last())) {
                                a11yToggle.close($this);
                            }
                        }
                    }
                });
            },


            /**
             * Trapfocus inside dropdown element for accessibility.
             *
             * @param $this
             */
            trapFocus: function ($this) {
                var state = app.getState($this);

                // Set last focused element so we can re-focus on close
                state.lastfocus = document.activeElement;

                // All focusable elements
                // From: https://github.com/edenspiekermann/a11y-dialog/blob/master/a11y-dialog.js#L31
                var links = state.target.find(focusableElements);

                links.filter(function () {
                    return $(this).attr('attributeid') == 41
                });
                console.log(links.filter('[type=radio]'));

                // store first focusable element for future reference
                state.firstFocusElement = links.first();

                // set focus on first element
                if (state.firstFocusElement != undefined) {
                    setTimeout(function () {
                        state.firstFocusElement.focus();
                    }, 50)
                }

                // Check if fired callback is binded to element so we don't bind it multiple times
                if (!state.fired) {

                    // Watch for close event
                    $this.on("a11ytoggle:close", function () {
                        if (!state.open) {
                            if (state.settings.restoreFocus) {
                                state.lastfocus.focus();
                            }
                        }
                    });

                    state.fired = true;
                }

                // Start focus on close button
                state.firstFocusElement.focus();

                /**
                 * Based on http://dylanb.github.io/javascripts/periodic-1.1.js
                 */
                state.target.on('keydown', function (e) {
                    var cancel = false;

                    if (e.ctrlKey || e.metaKey || e.altKey || !state.open) {
                        return;
                    }

                    switch (e.which) {
                        case 27: // ESC
                            cancel = true;
                            break;
                        case 9: // TAB
                            if (e.shiftKey) {
                                if (e.target === links[0]) {
                                    links[links.length - 1].focus();
                                    cancel = true;
                                }
                            } else {
                                if (e.target === links[links.length - 1]) {
                                    links[0].focus();
                                    cancel = true;
                                }
                            }
                            break;
                    }
                    if (cancel) {
                        e.preventDefault();
                    }
                });
            }
        };

        this.open = function ($this, kb) {
            var state = app.getState($this);
            kb ? state.kb = kb : state.kb = false;
            state.parent.addClass(state.settings.activeClass);
            state.open = true;
            state.target.attr('aria-hidden', false);
            $this.attr('aria-expanded', true);
            $this.addClass(state.settings.activeClass);
            state.target.addClass(state.settings.activeClass);

            // Trap focus
            if (state.trapfocus == true) {
                app.trapFocus($this);
            }

            // Fire open event
            $this.trigger("a11ytoggle:open", [$this]);
        };

        this.close = function ($this) {
            var state = app.getState($this);
            state.kb = false;
            state.parent.removeClass(state.settings.activeClass);
            state.open = false;
            state.target.attr('aria-hidden', true);
            $this.attr('aria-expanded', false);
            $this.removeClass(state.settings.activeClass);
            state.target.removeClass(state.settings.activeClass);

            // Fire close event
            $this.trigger("a11ytoggle:close", [$this]);
        };

        /**
         * Loop over all instances
         */
        $(this).each(function () {

            var ran = $(this).is('[data-a11y-instance]');

            if (!ran) {

                /*
                 * Plugin default options
                 */
                var settings = $.extend({
                    parent: $(this).is('[data-a11y-parent]') ? $(this).data('a11y-parent') : true,
                    target: $(this).is('[data-a11y-target]') ? $(this).data('a11y-target') : '.js-a11y-target',
                    activeClass: 'is-open',
                    outside: $(this).is('[data-a11y-outside]') ? $(this).data('a11y-outside') : true,
                    escape: $(this).is('[data-a11y-esc]') ? $(this).data('a11y-esc') : true,
                    closeButton: '.js-a11y-close',
                    trapfocus: $(this).is('[data-a11y-trapfocus]') ? $(this).data('a11y-trapfocus') : false,
                    openOnFocus: $(this).is('[data-a11y-openonfocus]') ? $(this).data('a11y-openonfocus') : false,
                    restoreFocus: $(this).is('[data-a11y-restore-focus]') ? $(this).data('a11y-restore-focus') : true,
                    aria: true
                }, options);

                /**
                 * Keep state, aka settings and values specific to each instant.
                 */
                state.push({
                    settings: settings,
                    open: false,
                    parent: (settings.parent === true) ? $(this).parent() : $(this).closest(settings.parent),
                    $this: $(this),
                    trapfocus: settings.trapfocus,
                    openOnFocus: settings.openOnFocus
                });

                // Store target
                state[instance].target = state[instance].parent.find(settings.target).first();

                // Store close button that is found in state.target.
                state[instance].close = state[instance].target.find(settings.closeButton);

                app.prepareHtml($(this), instance);

                // Auto open on focus
                if (state[instance].openOnFocus == true) {
                    app.openOnFocus($(this));
                }
            }
            app.bindUIevents($(this), state[instance]);

            // Increment instance count on each loop
            if (!ran) {
                instance++;
            }
        });

        return this;
    };

    /**
     * Auto discover
     */
    $('.js-a11y-toggle').each(function () {
        var settings = $(this).data('a11y-settings');
        $(this).a11yToggle(settings);
    })

}(jQuery));