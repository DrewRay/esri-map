/*! angularjs-slider - v2.11.0 - 
 (c) Rafal Zajac <rzajac@gmail.com>, Valentin Hervieu <valentin@hervieu.me>, Jussi Saarivirta <jusasi@gmail.com>, Angelin Sirbu <angelin.sirbu@gmail.com> - 
 https://github.com/angular-slider/angularjs-slider - 
 2016-04-01 */
/*jslint unparam: true */
/*global angular: false, console: false, define, module */
// (function(root, factory) {
//   'use strict';
//   /* istanbul ignore next */
//   if (typeof define === 'function' && define.amd) {
//     // AMD. Register as an anonymous module.
//     define(['angular'], factory);
//   } else if (typeof module === 'object' && module.exports) {
//     // Node. Does not work with strict CommonJS, but
//     // only CommonJS-like environments that support module.exports,
//     // like Node.
//     // to support bundler like browserify
//     module.exports = factory(require('angular'));
//   } else {
//     // Browser globals (root is window)
//     factory(root.angular);
//   }

// }(this, function(angular) {
//   'use strict';
//   var module = angular.module('rzModule', [])

//   .factory('RzSliderOptions', function() {
//     var defaultOptions = {
//       floor: 0,
//       ceil: null, //defaults to rz-slider-model
//       step: 1,
//       precision: 0,
//       minRange: 0,
//       id: null,
//       translate: null,
//       stepsArray: null,
//       draggableRange: false,
//       draggableRangeOnly: false,
//       showSelectionBar: false,
//       showSelectionBarEnd: false,
//       showSelectionBarFromValue: null,
//       hidePointerLabels: false,
//       hideLimitLabels: false,
//       readOnly: false,
//       disabled: false,
//       interval: 350,
//       showTicks: false,
//       showTicksValues: false,
//       ticksTooltip: null,
//       ticksValuesTooltip: null,
//       vertical: false,
//       getSelectionBarColor: null,
//       getPointerColor: null,
//       keyboardSupport: true,
//       scale: 1,
//       enforceStep: true,
//       enforceRange: false,
//       noSwitching: false,
//       onlyBindHandles: false,
//       onStart: null,
//       onChange: null,
//       onEnd: null,
//       rightToLeft: false
//     };
//     var globalOptions = {};

//     var factory = {};
//     /**
//      * `options({})` allows global configuration of all sliders in the
//      * application.
//      *
//      *   var app = angular.module( 'App', ['rzModule'], function( RzSliderOptions ) {
//      *     // show ticks for all sliders
//      *     RzSliderOptions.options( { showTicks: true } );
//      *   });
//      */
//     factory.options = function(value) {
//       angular.extend(globalOptions, value);
//     };

//     factory.getOptions = function(options) {
//       return angular.extend({}, defaultOptions, globalOptions, options);
//     };

//     return factory;
//   })

//   .factory('rzThrottle', ['$timeout', function($timeout) {
//     /**
//      * rzThrottle
//      *
//      * Taken from underscore project
//      *
//      * @param {Function} func
//      * @param {number} wait
//      * @param {ThrottleOptions} options
//      * @returns {Function}
//      */
//     return function(func, wait, options) {
//       'use strict';
//       /* istanbul ignore next */
//       var getTime = (Date.now || function() {
//         return new Date().getTime();
//       });
//       var context, args, result;
//       var timeout = null;
//       var previous = 0;
//       options = options || {};
//       var later = function() {
//         previous = getTime();
//         timeout = null;
//         result = func.apply(context, args);
//         context = args = null;
//       };
//       return function() {
//         var now = getTime();
//         var remaining = wait - (now - previous);
//         context = this;
//         args = arguments;
//         if (remaining <= 0) {
//           $timeout.cancel(timeout);
//           timeout = null;
//           previous = now;
//           result = func.apply(context, args);
//           context = args = null;
//         } else if (!timeout && options.trailing !== false) {
//           timeout = $timeout(later, remaining);
//         }
//         return result;
//       };
//     }
//   }])

//   .factory('RzSlider', ['$timeout', '$document', '$window', '$compile', 'RzSliderOptions', 'rzThrottle', function($timeout, $document, $window, $compile, RzSliderOptions, rzThrottle) {
//     'use strict';

//     /**
//      * Slider
//      *
//      * @param {ngScope} scope            The AngularJS scope
//      * @param {Element} sliderElem The slider directive element wrapped in jqLite
//      * @constructor
//      */
//     var Slider = function(scope, sliderElem) {
//       /**
//        * The slider's scope
//        *
//        * @type {ngScope}
//        */
//       this.scope = scope;

//       /**
//        * Slider element wrapped in jqLite
//        *
//        * @type {jqLite}
//        */
//       this.sliderElem = sliderElem;

//       /**
//        * Slider type
//        *
//        * @type {boolean} Set to true for range slider
//        */
//       this.range = this.scope.rzSliderModel !== undefined && this.scope.rzSliderHigh !== undefined;

//       /**
//        * Values recorded when first dragging the bar
//        *
//        * @type {Object}
//        */
//       this.dragging = {
//         active: false,
//         value: 0,
//         difference: 0,
//         offset: 0,
//         lowLimit: 0,
//         highLimit: 0
//       };

//       /**
//        * property that handle position (defaults to left for horizontal)
//        * @type {string}
//        */
//       this.positionProperty = 'left';

//       /**
//        * property that handle dimension (defaults to width for horizontal)
//        * @type {string}
//        */
//       this.dimensionProperty = 'width';

//       /**
//        * Half of the width or height of the slider handles
//        *
//        * @type {number}
//        */
//       this.handleHalfDim = 0;

//       /**
//        * Maximum position the slider handle can have
//        *
//        * @type {number}
//        */
//       this.maxPos = 0;

//       /**
//        * Precision
//        *
//        * @type {number}
//        */
//       this.precision = 0;

//       /**
//        * Step
//        *
//        * @type {number}
//        */
//       this.step = 1;

//       /**
//        * The name of the handle we are currently tracking
//        *
//        * @type {string}
//        */
//       this.tracking = '';

//       /**
//        * Minimum value (floor) of the model
//        *
//        * @type {number}
//        */
//       this.minValue = 0;

//       /**
//        * Maximum value (ceiling) of the model
//        *
//        * @type {number}
//        */
//       this.maxValue = 0;


//       /**
//        * The delta between min and max value
//        *
//        * @type {number}
//        */
//       this.valueRange = 0;

//       /**
//        * Set to true if init method already executed
//        *
//        * @type {boolean}
//        */
//       this.initHasRun = false;

//       /**
//        * Internal flag to prevent watchers to be called when the sliders value are modified internally.
//        * @type {boolean}
//        */
//       this.internalChange = false;

//       // Slider DOM elements wrapped in jqLite
//       this.fullBar = null; // The whole slider bar
//       this.selBar = null; // Highlight between two handles
//       this.minH = null; // Left slider handle
//       this.maxH = null; // Right slider handle
//       this.flrLab = null; // Floor label
//       this.ceilLab = null; // Ceiling label
//       this.minLab = null; // Label above the low value
//       this.maxLab = null; // Label above the high value
//       this.cmbLab = null; // Combined label
//       this.ticks = null; // The ticks

//       // Initialize slider
//       this.init();
//     };

//     // Add instance methods
//     Slider.prototype = {

//       /**
//        * Initialize slider
//        *
//        * @returns {undefined}
//        */
//       init: function() {
//         var thrLow, thrHigh,
//           self = this;

//         var calcDimFn = function() {
//           self.calcViewDimensions();
//         };

//         this.applyOptions();
//         this.initElemHandles();
//         this.manageElementsStyle();
//         this.setDisabledState();
//         this.calcViewDimensions();
//         this.setMinAndMax();
//         this.addAccessibility();
//         this.updateCeilLab();
//         this.updateFloorLab();
//         this.initHandles();
//         this.manageEventsBindings();

//         // Recalculate slider view dimensions
//         this.scope.$on('reCalcViewDimensions', calcDimFn);

//         // Recalculate stuff if view port dimensions have changed
//         angular.element($window).on('resize', calcDimFn);

//         this.initHasRun = true;

//         // Watch for changes to the model
//         thrLow = rzThrottle(function() {
//           self.onLowHandleChange();
//         }, self.options.interval);

//         thrHigh = rzThrottle(function() {
//           self.onHighHandleChange();
//         }, self.options.interval);

//         this.scope.$on('rzSliderForceRender', function() {
//           self.resetLabelsValue();
//           thrLow();
//           if (self.range) {
//             thrHigh();
//           }
//           self.resetSlider();
//         });

//         // Watchers (order is important because in case of simultaneous change,
//         // watchers will be called in the same order)
//         this.scope.$watch('rzSliderOptions()', function(newValue, oldValue) {
//           if (newValue === oldValue)
//             return;
//           self.applyOptions();
//           self.resetSlider();
//         }, true);

//         this.scope.$watch('rzSliderModel', function(newValue, oldValue) {
//           if (self.internalChange)
//             return;
//           if (newValue === oldValue)
//             return;
//           thrLow();
//         });

//         this.scope.$watch('rzSliderHigh', function(newValue, oldValue) {
//           if (self.internalChange)
//             return;
//           if (newValue === oldValue)
//             return;
//           if (newValue != null)
//             thrHigh();
//           if (self.range && newValue == null || !self.range && newValue != null) {
//             self.applyOptions();
//             self.resetSlider();
//           }
//         });

//         this.scope.$on('$destroy', function() {
//           self.unbindEvents();
//           angular.element($window).off('resize', calcDimFn);
//         });
//       },

//       /*
//        * Reflow the slider when the low handle changes (called with throttle)
//        */
//       onLowHandleChange: function() {
//         this.setMinAndMax();
//         this.updateLowHandle(this.valueToOffset(this.scope.rzSliderModel));
//         this.updateSelectionBar();
//         this.updateTicksScale();
//         this.updateAriaAttributes();
//         if (this.range) {
//           this.updateCmbLabel();
//         }
//       },

//       /*
//        * Reflow the slider when the high handle changes (called with throttle)
//        */
//       onHighHandleChange: function() {
//         this.setMinAndMax();
//         this.updateHighHandle(this.valueToOffset(this.scope.rzSliderHigh));
//         this.updateSelectionBar();
//         this.updateTicksScale();
//         this.updateCmbLabel();
//         this.updateAriaAttributes();
//       },

//       /**
//        * Read the user options and apply them to the slider model
//        */
//       applyOptions: function() {
//         var sliderOptions;
//         if (this.scope.rzSliderOptions)
//           sliderOptions = this.scope.rzSliderOptions();
//         else
//           sliderOptions = {};

//         this.options = RzSliderOptions.getOptions(sliderOptions);

//         if (this.options.step <= 0)
//           this.options.step = 1;

//         this.range = this.scope.rzSliderModel !== undefined && this.scope.rzSliderHigh !== undefined;
//         this.options.draggableRange = this.range && this.options.draggableRange;
//         this.options.draggableRangeOnly = this.range && this.options.draggableRangeOnly;
//         if (this.options.draggableRangeOnly) {
//           this.options.draggableRange = true;
//         }

//         this.options.showTicks = this.options.showTicks || this.options.showTicksValues;
//         this.scope.showTicks = this.options.showTicks; //scope is used in the template

//         this.options.showSelectionBar = this.options.showSelectionBar || this.options.showSelectionBarEnd
//           || this.options.showSelectionBarFromValue !== null;

//         if (this.options.stepsArray) {
//           this.options.floor = 0;
//           this.options.ceil = this.options.stepsArray.length - 1;
//           this.options.step = 1;
//           if (this.options.translate) {
//             this.customTrFn = this.options.translate;
//           }
//           else {
//             this.customTrFn = function(value) {
//               return this.options.stepsArray[value];
//             };
//           }
//         } else if (this.options.translate)
//           this.customTrFn = this.options.translate;
//         else
//           this.customTrFn = function(value) {
//             return String(value);
//           };

//         if (this.options.vertical) {
//           this.positionProperty = 'bottom';
//           this.dimensionProperty = 'height';
//         }
//       },

//       /**
//        * Resets slider
//        *
//        * @returns {undefined}
//        */
//       resetSlider: function() {
//         this.manageElementsStyle();
//         this.addAccessibility();
//         this.setMinAndMax();
//         this.updateCeilLab();
//         this.updateFloorLab();
//         this.unbindEvents();
//         this.manageEventsBindings();
//         this.setDisabledState();
//         this.calcViewDimensions();
//       },

//       /**
//        * Set the slider children to variables for easy access
//        *
//        * Run only once during initialization
//        *
//        * @returns {undefined}
//        */
//       initElemHandles: function() {
//         // Assign all slider elements to object properties for easy access
//         angular.forEach(this.sliderElem.children(), function(elem, index) {
//           var jElem = angular.element(elem);

//           switch (index) {
//             case 0:
//               this.fullBar = jElem;
//               break;
//             case 1:
//               this.selBar = jElem;
//               break;
//             case 2:
//               this.minH = jElem;
//               break;
//             case 3:
//               this.maxH = jElem;
//               break;
//             case 4:
//               this.flrLab = jElem;
//               break;
//             case 5:
//               this.ceilLab = jElem;
//               break;
//             case 6:
//               this.minLab = jElem;
//               break;
//             case 7:
//               this.maxLab = jElem;
//               break;
//             case 8:
//               this.cmbLab = jElem;
//               break;
//             case 9:
//               this.ticks = jElem;
//               break;
//           }

//         }, this);

//         // Initialize offset cache properties
//         this.selBar.rzsp = 0;
//         this.minH.rzsp = 0;
//         this.maxH.rzsp = 0;
//         this.flrLab.rzsp = 0;
//         this.ceilLab.rzsp = 0;
//         this.minLab.rzsp = 0;
//         this.maxLab.rzsp = 0;
//         this.cmbLab.rzsp = 0;
//       },

//       /**
//        * Update each elements style based on options
//        */
//       manageElementsStyle: function() {

//         if (!this.range)
//           this.maxH.css('display', 'none');
//         else
//           this.maxH.css('display', '');

//         this.alwaysHide(this.flrLab, this.options.showTicksValues || this.options.hideLimitLabels);
//         this.alwaysHide(this.ceilLab, this.options.showTicksValues || this.options.hideLimitLabels);
//         this.alwaysHide(this.minLab, this.options.showTicksValues || this.options.hidePointerLabels);
//         this.alwaysHide(this.maxLab, this.options.showTicksValues || !this.range || this.options.hidePointerLabels);
//         this.alwaysHide(this.cmbLab, this.options.showTicksValues || !this.range || this.options.hidePointerLabels);
//         this.alwaysHide(this.selBar, !this.range && !this.options.showSelectionBar);

//         if (this.options.vertical)
//           this.sliderElem.addClass('rz-vertical');

//         if (this.options.draggableRange)
//           this.selBar.addClass('rz-draggable');
//         else
//           this.selBar.removeClass('rz-draggable');
//       },

//       alwaysHide: function(el, hide) {
//         el.rzAlwaysHide = hide;
//         if (hide)
//           this.hideEl(el);
//         else
//           this.showEl(el)
//       },

//       /**
//        * Manage the events bindings based on readOnly and disabled options
//        *
//        * @returns {undefined}
//        */
//       manageEventsBindings: function() {
//         if (this.options.disabled || this.options.readOnly)
//           this.unbindEvents();
//         else
//           this.bindEvents();
//       },

//       /**
//        * Set the disabled state based on rzSliderDisabled
//        *
//        * @returns {undefined}
//        */
//       setDisabledState: function() {
//         if (this.options.disabled) {
//           this.sliderElem.attr('disabled', 'disabled');
//         } else {
//           this.sliderElem.attr('disabled', null);
//         }
//       },

//       /**
//        * Reset label values
//        *
//        * @return {undefined}
//        */
//       resetLabelsValue: function() {
//         this.minLab.rzsv = undefined;
//         this.maxLab.rzsv = undefined;
//       },

//       /**
//        * Initialize slider handles positions and labels
//        *
//        * Run only once during initialization and every time view port changes size
//        *
//        * @returns {undefined}
//        */
//       initHandles: function() {
//         this.updateLowHandle(this.valueToOffset(this.scope.rzSliderModel));

//         /*
//          the order here is important since the selection bar should be
//          updated after the high handle but before the combined label
//          */
//         if (this.range)
//           this.updateHighHandle(this.valueToOffset(this.scope.rzSliderHigh));
//         this.updateSelectionBar();
//         if (this.range)
//           this.updateCmbLabel();

//         this.updateTicksScale();
//       },

//       /**
//        * Translate value to human readable format
//        *
//        * @param {number|string} value
//        * @param {jqLite} label
//        * @param {boolean} [useCustomTr]
//        * @returns {undefined}
//        */
//       translateFn: function(value, label, which, useCustomTr) {
//         useCustomTr = useCustomTr === undefined ? true : useCustomTr;

//         var valStr = String((useCustomTr ? this.customTrFn(value, this.options.id, which) : value)),
//           getDimension = false;

//         if (label.rzsv === undefined || label.rzsv.length !== valStr.length || (label.rzsv.length > 0 && label.rzsd === 0)) {
//           getDimension = true;
//           label.rzsv = valStr;
//         }

//         label.html(valStr);

//         // Update width only when length of the label have changed
//         if (getDimension) {
//           this.getDimension(label);
//         }
//       },

//       /**
//        * Set maximum and minimum values for the slider and ensure the model and high
//        * value match these limits
//        * @returns {undefined}
//        */
//       setMinAndMax: function() {

//         this.step = +this.options.step;
//         this.precision = +this.options.precision;

//         this.minValue = this.options.floor;

//         if (this.options.enforceStep) {
//           this.scope.rzSliderModel = this.roundStep(this.scope.rzSliderModel);
//           if (this.range)
//             this.scope.rzSliderHigh = this.roundStep(this.scope.rzSliderHigh);
//         }

//         if (this.options.ceil != null)
//           this.maxValue = this.options.ceil;
//         else
//           this.maxValue = this.options.ceil = this.range ? this.scope.rzSliderHigh : this.scope.rzSliderModel;

//         if (this.options.enforceRange) {
//           this.scope.rzSliderModel = this.sanitizeValue(this.scope.rzSliderModel);
//           if (this.range)
//             this.scope.rzSliderHigh = this.sanitizeValue(this.scope.rzSliderHigh);
//         }

//         this.valueRange = this.maxValue - this.minValue;
//       },

//       /**
//        * Adds accessibility attributes
//        *
//        * Run only once during initialization
//        *
//        * @returns {undefined}
//        */
//       addAccessibility: function() {
//         this.minH.attr('role', 'slider');
//         this.updateAriaAttributes();
//         if (this.options.keyboardSupport && !(this.options.readOnly || this.options.disabled))
//           this.minH.attr('tabindex', '0');
//         else
//           this.minH.attr('tabindex', '');
//         if (this.options.vertical)
//           this.minH.attr('aria-orientation', 'vertical');

//         if (this.range) {
//           this.maxH.attr('role', 'slider');
//           if (this.options.keyboardSupport && !(this.options.readOnly || this.options.disabled))
//             this.maxH.attr('tabindex', '0');
//           else
//             this.maxH.attr('tabindex', '');
//           if (this.options.vertical)
//             this.maxH.attr('aria-orientation', 'vertical');
//         }
//       },

//       /**
//        * Updates aria attributes according to current values
//        */
//       updateAriaAttributes: function() {
//         this.minH.attr({
//           'aria-valuenow': this.scope.rzSliderModel,
//           'aria-valuetext': this.customTrFn(this.scope.rzSliderModel, this.options.id, 'model'),
//           'aria-valuemin': this.minValue,
//           'aria-valuemax': this.maxValue
//         });
//         if (this.range) {
//           this.maxH.attr({
//             'aria-valuenow': this.scope.rzSliderHigh,
//             'aria-valuetext': this.customTrFn(this.scope.rzSliderHigh, this.options.id, 'high'),
//             'aria-valuemin': this.minValue,
//             'aria-valuemax': this.maxValue
//           });
//         }
//       },

//       /**
//        * Calculate dimensions that are dependent on view port size
//        *
//        * Run once during initialization and every time view port changes size.
//        *
//        * @returns {undefined}
//        */
//       calcViewDimensions: function() {
//         var handleWidth = this.getDimension(this.minH);

//         this.handleHalfDim = handleWidth / 2;
//         this.barDimension = this.getDimension(this.fullBar);

//         this.maxPos = this.barDimension - handleWidth;

//         this.getDimension(this.sliderElem);
//         this.sliderElem.rzsp = this.sliderElem[0].getBoundingClientRect()[this.positionProperty];

//         if (this.initHasRun) {
//           this.updateFloorLab();
//           this.updateCeilLab();
//           this.initHandles();
//         }
//       },

//       /**
//        * Update the ticks position
//        *
//        * @returns {undefined}
//        */
//       updateTicksScale: function() {
//         if (!this.options.showTicks) return;

//         var positions = '',
//           ticksCount = Math.round((this.maxValue - this.minValue) / this.step) + 1;
//         this.scope.ticks = [];
//         for (var i = 0; i < ticksCount; i++) {
//           var value = this.roundStep(this.minValue + i * this.step);
//           var tick = {
//             selected: this.isTickSelected(value)
//           };
//           if (tick.selected && this.options.getSelectionBarColor) {
//             tick.style = {
//               'background-color': this.getSelectionBarColor()
//             };
//           }
//           if (this.options.ticksTooltip) {
//             tick.tooltip = this.options.ticksTooltip(value);
//             tick.tooltipPlacement = this.options.vertical ? 'right' : 'top';
//           }
//           if (this.options.showTicksValues) {
//             tick.value = this.getDisplayValue(value, 'tick-value');
//             if (this.options.ticksValuesTooltip) {
//               tick.valueTooltip = this.options.ticksValuesTooltip(value);
//               tick.valueTooltipPlacement = this.options.vertical ? 'right' : 'top';
//             }
//           }
//           if (!this.options.rightToLeft) {
//             this.scope.ticks.push(tick);
//           } else {
//             this.scope.ticks.unshift(tick);
//           }
//         }
//       },

//       isTickSelected: function(value) {
//         if (!this.range) {
//           if (this.options.showSelectionBarFromValue !== null) {
//             var center = this.options.showSelectionBarFromValue;
//             if (this.scope.rzSliderModel > center && value >= center && value <= this.scope.rzSliderModel)
//               return true;
//             else if (this.scope.rzSliderModel < center && value <= center && value >= this.scope.rzSliderModel)
//               return true;
//           }
//           else if (this.options.showSelectionBarEnd) {
//             if (value >= this.scope.rzSliderModel)
//               return true;
//           }
//           else if (this.options.showSelectionBar && value <= this.scope.rzSliderModel)
//             return true;
//         }
//         if (this.range && value >= this.scope.rzSliderModel && value <= this.scope.rzSliderHigh)
//           return true;
//         return false;
//       },

//       /**
//        * Update position of the floor label
//        *
//        * @returns {undefined}
//        */
//       updateFloorLab: function() {
//         this.translateFn(this.minValue, this.flrLab, 'floor');
//         this.getDimension(this.flrLab);
//         var position = this.options.rightToLeft ? this.barDimension - this.flrLab.rzsd : 0;
//         this.setPosition(this.flrLab, position);
//       },

//       /**
//        * Update position of the ceiling label
//        *
//        * @returns {undefined}
//        */
//       updateCeilLab: function() {
//         this.translateFn(this.maxValue, this.ceilLab, 'ceil');
//         this.getDimension(this.ceilLab);
//         var position = this.options.rightToLeft ? 0 : this.barDimension - this.ceilLab.rzsd;
//         this.setPosition(this.ceilLab, position);
//       },

//       /**
//        * Update slider handles and label positions
//        *
//        * @param {string} which
//        * @param {number} newOffset
//        */
//       updateHandles: function(which, newOffset) {
//         if (which === 'rzSliderModel')
//           this.updateLowHandle(newOffset);
//         else
//           this.updateHighHandle(newOffset);

//         this.updateSelectionBar();
//         this.updateTicksScale();
//         if (this.range)
//           this.updateCmbLabel();
//       },

//       /**
//        * Helper function to work out the position for handle labels depending on RTL or not
//        *
//        * @param {string} labelName maxLab or minLab
//        * @param newOffset
//        *
//        * @returns {number}
//        */
//       getHandleLabelPos: function(labelName, newOffset) {
//         var labelRzsd = this[labelName].rzsd,
//           nearHandlePos = newOffset - labelRzsd / 2 + this.handleHalfDim,
//           endOfBarPos = this.barDimension - labelRzsd;

//         if (this.options.rightToLeft && labelName === 'minLab' || !this.options.rightToLeft && labelName === 'maxLab') {
//           return Math.min(nearHandlePos, endOfBarPos);
//         } else {
//           return Math.min(Math.max(nearHandlePos, 0), endOfBarPos);
//         }
//       },

//       /**
//        * Update low slider handle position and label
//        *
//        * @param {number} newOffset
//        * @returns {undefined}
//        */
//       updateLowHandle: function(newOffset) {
//         this.setPosition(this.minH, newOffset);
//         this.translateFn(this.scope.rzSliderModel, this.minLab, 'model');
//         this.setPosition(this.minLab, this.getHandleLabelPos('minLab', newOffset));

//         if (this.options.getPointerColor) {
//           var pointercolor = this.getPointerColor('min');
//           this.scope.minPointerStyle = {
//             backgroundColor: pointercolor
//           };
//         }

//         this.shFloorCeil();
//       },

//       /**
//        * Update high slider handle position and label
//        *
//        * @param {number} newOffset
//        * @returns {undefined}
//        */
//       updateHighHandle: function(newOffset) {
//         this.setPosition(this.maxH, newOffset);
//         this.translateFn(this.scope.rzSliderHigh, this.maxLab, 'high');
//         this.setPosition(this.maxLab, this.getHandleLabelPos('maxLab', newOffset));

//         if (this.options.getPointerColor) {
//           var pointercolor = this.getPointerColor('max');
//           this.scope.maxPointerStyle = {
//             backgroundColor: pointercolor
//           };
//         }

//         this.shFloorCeil();
//       },

//       /**
//        * Show/hide floor/ceiling label
//        *
//        * @returns {undefined}
//        */
//       shFloorCeil: function() {
//         var flHidden = false,
//           clHidden = false,
//           isRTL = this.options.rightToLeft,
//           flrLabPos = this.flrLab.rzsp,
//           flrLabDim = this.flrLab.rzsd,
//           minLabPos = this.minLab.rzsp,
//           minLabDim = this.minLab.rzsd,
//           maxLabPos = this.maxLab.rzsp,
//           maxLabDim = this.maxLab.rzsd,
//           ceilLabPos = this.ceilLab.rzsp,
//           halfHandle = this.handleHalfDim,
//           isMinLabAtFloor = isRTL ? minLabPos + minLabDim >= flrLabPos - flrLabDim - 5 : minLabPos <= flrLabPos + flrLabDim + 5,
//           isMinLabAtCeil = isRTL ? minLabPos - minLabDim <= ceilLabPos + halfHandle + 10 : minLabPos + minLabDim >= ceilLabPos - halfHandle - 10,
//           isMaxLabAtFloor = isRTL ? maxLabPos >= flrLabPos - flrLabDim - halfHandle : maxLabPos <= flrLabPos + flrLabDim + halfHandle,
//           isMaxLabAtCeil = isRTL ? maxLabPos - maxLabDim <= ceilLabPos + 10 : maxLabPos + maxLabDim >= ceilLabPos - 10;


//         if (isMinLabAtFloor) {
//           flHidden = true;
//           this.hideEl(this.flrLab);
//         } else {
//           flHidden = false;
//           this.showEl(this.flrLab);
//         }

//         if (isMinLabAtCeil) {
//           clHidden = true;
//           this.hideEl(this.ceilLab);
//         } else {
//           clHidden = false;
//           this.showEl(this.ceilLab);
//         }

//         if (this.range) {
//           if (isMaxLabAtCeil) {
//             this.hideEl(this.ceilLab);
//           } else if (!clHidden) {
//             this.showEl(this.ceilLab);
//           }

//           // Hide or show floor label
//           if (isMaxLabAtFloor) {
//             this.hideEl(this.flrLab);
//           } else if (!flHidden) {
//             this.showEl(this.flrLab);
//           }
//         }
//       },

//       /**
//        * Update slider selection bar, combined label and range label
//        *
//        * @returns {undefined}
//        */
//       updateSelectionBar: function() {
//         var position = 0,
//           dimension = 0,
//           isSelectionBarFromRight = this.options.rightToLeft ? !this.options.showSelectionBarEnd : this.options.showSelectionBarEnd,
//           positionForRange = this.options.rightToLeft ? this.maxH.rzsp + this.handleHalfDim : this.minH.rzsp + this.handleHalfDim;

//         if (this.range) {
//           dimension = Math.abs(this.maxH.rzsp - this.minH.rzsp);
//           position = positionForRange;
//         }
//         else {
//           if (this.options.showSelectionBarFromValue !== null) {
//             var center = this.options.showSelectionBarFromValue,
//               centerPosition = this.valueToOffset(center),
//               isModelGreaterThanCenter = this.options.rightToLeft ? this.scope.rzSliderModel <= center : this.scope.rzSliderModel > center;
//             if (isModelGreaterThanCenter) {
//               dimension = this.minH.rzsp - centerPosition;
//               position = centerPosition + this.handleHalfDim;
//             }
//             else {
//               dimension = centerPosition - this.minH.rzsp;
//               position = this.minH.rzsp + this.handleHalfDim;
//             }
//           }
//           else if (isSelectionBarFromRight) {
//             dimension = Math.abs(this.maxPos - this.minH.rzsp) + this.handleHalfDim;
//             position = this.minH.rzsp + this.handleHalfDim;
//           } else {
//             dimension = Math.abs(this.maxH.rzsp - this.minH.rzsp) + this.handleHalfDim;
//             position = 0;
//           }
//         }
//         this.setDimension(this.selBar, dimension);
//         this.setPosition(this.selBar, position);
//         if (this.options.getSelectionBarColor) {
//           var color = this.getSelectionBarColor();
//           this.scope.barStyle = {
//             backgroundColor: color
//           };
//         }
//       },

//       /**
//        * Wrapper around the getSelectionBarColor of the user to pass to
//        * correct parameters
//        */
//       getSelectionBarColor: function() {
//         if (this.range)
//           return this.options.getSelectionBarColor(this.scope.rzSliderModel, this.scope.rzSliderHigh);
//         return this.options.getSelectionBarColor(this.scope.rzSliderModel);
//       },

//       /**
//        * Wrapper around the getPointerColor of the user to pass to
//        * correct parameters
//        */
//       getPointerColor: function(pointerType) {
//         if (pointerType === 'max') {
//           return this.options.getPointerColor(this.scope.rzSliderHigh, pointerType);
//         }
//         return this.options.getPointerColor(this.scope.rzSliderModel, pointerType);
//       },

//       /**
//        * Update combined label position and value
//        *
//        * @returns {undefined}
//        */
//       updateCmbLabel: function() {
//         var isLabelOverlap = null;
//         if (this.options.rightToLeft) {
//           isLabelOverlap = this.minLab.rzsp - this.minLab.rzsd - 10 <= this.maxLab.rzsp;
//         } else {
//           isLabelOverlap = this.minLab.rzsp + this.minLab.rzsd + 10 >= this.maxLab.rzsp;
//         }

//         if (isLabelOverlap) {
//           var lowTr = this.getDisplayValue(this.scope.rzSliderModel, 'model'),
//             highTr = this.getDisplayValue(this.scope.rzSliderHigh, 'high'),
//             labelVal = '';
//           if (lowTr === highTr) {
//             labelVal = lowTr;
//           } else {
//             labelVal = this.options.rightToLeft ? highTr + ' - ' + lowTr : lowTr + ' - ' + highTr;
//           }

//           this.translateFn(labelVal, this.cmbLab, 'cmb', false);
//           var pos = Math.min(
//             Math.max(
//               this.selBar.rzsp + this.selBar.rzsd / 2 - this.cmbLab.rzsd / 2,
//               0
//             ),
//             this.barDimension - this.cmbLab.rzsd
//           );
//           this.setPosition(this.cmbLab, pos);
//           this.hideEl(this.minLab);
//           this.hideEl(this.maxLab);
//           this.showEl(this.cmbLab);
//         } else {
//           this.showEl(this.maxLab);
//           this.showEl(this.minLab);
//           this.hideEl(this.cmbLab);
//         }
//       },

//       /**
//        * Return the translated value if a translate function is provided else the original value
//        * @param value
//        * @returns {*}
//        */
//       getDisplayValue: function(value, which) {
//         return this.customTrFn(value, this.options.id, which);
//       },

//       /**
//        * Round value to step and precision based on minValue
//        *
//        * @param {number} value
//        * @returns {number}
//        */
//       roundStep: function(value) {
//         var steppedDifference = parseFloat((value - this.minValue) / this.step).toPrecision(12);
//         steppedDifference = Math.round(steppedDifference) * this.step;
//         var newValue = (this.minValue + steppedDifference).toFixed(this.precision);
//         return +newValue;
//       },

//       /**
//        * Hide element
//        *
//        * @param element
//        * @returns {jqLite} The jqLite wrapped DOM element
//        */
//       hideEl: function(element) {
//         return element.css({
//           opacity: 0
//         });
//       },

//       /**
//        * Show element
//        *
//        * @param element The jqLite wrapped DOM element
//        * @returns {jqLite} The jqLite
//        */
//       showEl: function(element) {
//         if (!!element.rzAlwaysHide) {
//           return element;
//         }

//         return element.css({
//           opacity: 1
//         });
//       },

//       /**
//        * Set element left/top offset depending on whether slider is horizontal or vertical
//        *
//        * @param {jqLite} elem The jqLite wrapped DOM element
//        * @param {number} pos
//        * @returns {number}
//        */
//       setPosition: function(elem, pos) {
//         elem.rzsp = pos;
//         var css = {};
//         css[this.positionProperty] = pos + 'px';
//         elem.css(css);
//         return pos;
//       },

//       /**
//        * Get element width/height depending on whether slider is horizontal or vertical
//        *
//        * @param {jqLite} elem The jqLite wrapped DOM element
//        * @returns {number}
//        */
//       getDimension: function(elem) {
//         var val = elem[0].getBoundingClientRect();
//         if (this.options.vertical)
//           elem.rzsd = (val.bottom - val.top) * this.options.scale;
//         else
//           elem.rzsd = (val.right - val.left) * this.options.scale;
//         return elem.rzsd;
//       },

//       /**
//        * Set element width/height depending on whether slider is horizontal or vertical
//        *
//        * @param {jqLite} elem  The jqLite wrapped DOM element
//        * @param {number} dim
//        * @returns {number}
//        */
//       setDimension: function(elem, dim) {
//         elem.rzsd = dim;
//         var css = {};
//         css[this.dimensionProperty] = dim + 'px';
//         elem.css(css);
//         return dim;
//       },

//       /**
//        * Translate value to pixel offset
//        *
//        * @param {number} val
//        * @returns {number}
//        */
//       valueToOffset: function(val) {
//         if (this.options.rightToLeft) {
//           return (this.maxValue - this.sanitizeValue(val)) * this.maxPos / this.valueRange || 0;
//         }
//         return (this.sanitizeValue(val) - this.minValue) * this.maxPos / this.valueRange || 0;
//       },

//       /**
//        * Returns a value that is within slider range
//        *
//        * @param {number} val
//        * @returns {number}
//        */
//       sanitizeValue: function(val) {
//         return Math.min(Math.max(val, this.minValue), this.maxValue);
//       },

//       /**
//        * Translate offset to model value
//        *
//        * @param {number} offset
//        * @returns {number}
//        */
//       offsetToValue: function(offset) {
//         if (this.options.rightToLeft) {
//           return (1 - (offset / this.maxPos)) * this.valueRange + this.minValue;
//         }
//         return (offset / this.maxPos) * this.valueRange + this.minValue;
//       },

//       // Events

//       /**
//        * Get the X-coordinate or Y-coordinate of an event
//        *
//        * @param {Object} event  The event
//        * @returns {number}
//        */
//       getEventXY: function(event) {
//         /* http://stackoverflow.com/a/12336075/282882 */
//         //noinspection JSLint
//         var clientXY = this.options.vertical ? 'clientY' : 'clientX';
//         if (clientXY in event) {
//           return event[clientXY];
//         }

//         return event.originalEvent === undefined ?
//           event.touches[0][clientXY] : event.originalEvent.touches[0][clientXY];
//       },

//       /**
//        * Compute the event position depending on whether the slider is horizontal or vertical
//        * @param event
//        * @returns {number}
//        */
//       getEventPosition: function(event) {
//         var sliderPos = this.sliderElem.rzsp,
//           eventPos = 0;
//         if (this.options.vertical)
//           eventPos = -this.getEventXY(event) + sliderPos;
//         else
//           eventPos = this.getEventXY(event) - sliderPos;
//         return (eventPos - this.handleHalfDim) * this.options.scale;
//       },

//       /**
//        * Get event names for move and event end
//        *
//        * @param {Event}    event    The event
//        *
//        * @return {{moveEvent: string, endEvent: string}}
//        */
//       getEventNames: function(event) {
//         var eventNames = {
//           moveEvent: '',
//           endEvent: ''
//         };

//         if (event.touches || (event.originalEvent !== undefined && event.originalEvent.touches)) {
//           eventNames.moveEvent = 'touchmove';
//           eventNames.endEvent = 'touchend';
//         } else {
//           eventNames.moveEvent = 'mousemove';
//           eventNames.endEvent = 'mouseup';
//         }

//         return eventNames;
//       },

//       /**
//        * Get the handle closest to an event.
//        *
//        * @param event {Event} The event
//        * @returns {jqLite} The handle closest to the event.
//        */
//       getNearestHandle: function(event) {
//         if (!this.range) {
//           return this.minH;
//         }
//         var offset = this.getEventPosition(event),
//           distanceMin = Math.abs(offset - this.minH.rzsp),
//           distanceMax = Math.abs(offset - this.maxH.rzsp);
//         if (distanceMin < distanceMax)
//           return this.minH;
//         else if (distanceMin > distanceMax)
//           return this.maxH;
//         else if (!this.options.rightToLeft)
//         //if event is at the same distance from min/max then if it's at left of minH, we return minH else maxH
//           return offset < this.minH.rzsp ? this.minH : this.maxH;
//         else
//         //reverse in rtl
//           return offset > this.minH.rzsp ? this.minH : this.maxH;
//       },

//       /**
//        * Wrapper function to focus an angular element
//        *
//        * @param el {AngularElement} the element to focus
//        */
//       focusElement: function(el) {
//         var DOM_ELEMENT = 0;
//         el[DOM_ELEMENT].focus();
//       },

//       /**
//        * Bind mouse and touch events to slider handles
//        *
//        * @returns {undefined}
//        */
//       bindEvents: function() {
//         var barTracking, barStart, barMove;

//         if (this.options.draggableRange) {
//           barTracking = 'rzSliderDrag';
//           barStart = this.onDragStart;
//           barMove = this.onDragMove;
//         } else {
//           barTracking = 'rzSliderModel';
//           barStart = this.onStart;
//           barMove = this.onMove;
//         }

//         if (!this.options.onlyBindHandles) {
//           this.selBar.on('mousedown', angular.bind(this, barStart, null, barTracking));
//           this.selBar.on('mousedown', angular.bind(this, barMove, this.selBar));
//         }

//         if (this.options.draggableRangeOnly) {
//           this.minH.on('mousedown', angular.bind(this, barStart, null, barTracking));
//           this.maxH.on('mousedown', angular.bind(this, barStart, null, barTracking));
//         } else {
//           this.minH.on('mousedown', angular.bind(this, this.onStart, this.minH, 'rzSliderModel'));
//           if (this.range) {
//             this.maxH.on('mousedown', angular.bind(this, this.onStart, this.maxH, 'rzSliderHigh'));
//           }
//           if (!this.options.onlyBindHandles) {
//             this.fullBar.on('mousedown', angular.bind(this, this.onStart, null, null));
//             this.fullBar.on('mousedown', angular.bind(this, this.onMove, this.fullBar));
//             this.ticks.on('mousedown', angular.bind(this, this.onStart, null, null));
//             this.ticks.on('mousedown', angular.bind(this, this.onMove, this.ticks));
//           }
//         }

//         if (!this.options.onlyBindHandles) {
//           this.selBar.on('touchstart', angular.bind(this, barStart, null, barTracking));
//           this.selBar.on('touchstart', angular.bind(this, barMove, this.selBar));
//         }
//         if (this.options.draggableRangeOnly) {
//           this.minH.on('touchstart', angular.bind(this, barStart, null, barTracking));
//           this.maxH.on('touchstart', angular.bind(this, barStart, null, barTracking));
//         } else {
//           this.minH.on('touchstart', angular.bind(this, this.onStart, this.minH, 'rzSliderModel'));
//           if (this.range) {
//             this.maxH.on('touchstart', angular.bind(this, this.onStart, this.maxH, 'rzSliderHigh'));
//           }
//           if (!this.options.onlyBindHandles) {
//             this.fullBar.on('touchstart', angular.bind(this, this.onStart, null, null));
//             this.fullBar.on('touchstart', angular.bind(this, this.onMove, this.fullBar));
//             this.ticks.on('touchstart', angular.bind(this, this.onStart, null, null));
//             this.ticks.on('touchstart', angular.bind(this, this.onMove, this.ticks));
//           }
//         }

//         if (this.options.keyboardSupport) {
//           this.minH.on('focus', angular.bind(this, this.onPointerFocus, this.minH, 'rzSliderModel'));
//           if (this.range) {
//             this.maxH.on('focus', angular.bind(this, this.onPointerFocus, this.maxH, 'rzSliderHigh'));
//           }
//         }
//       },

//       /**
//        * Unbind mouse and touch events to slider handles
//        *
//        * @returns {undefined}
//        */
//       unbindEvents: function() {
//         this.minH.off();
//         this.maxH.off();
//         this.fullBar.off();
//         this.selBar.off();
//         this.ticks.off();
//       },

//       /**
//        * onStart event handler
//        *
//        * @param {?Object} pointer The jqLite wrapped DOM element; if null, the closest handle is used
//        * @param {?string} ref     The name of the handle being changed; if null, the closest handle's value is modified
//        * @param {Event}   event   The event
//        * @returns {undefined}
//        */
//       onStart: function(pointer, ref, event) {
//         var ehMove, ehEnd,
//           eventNames = this.getEventNames(event);

//         event.stopPropagation();
//         event.preventDefault();

//         // We have to do this in case the HTML where the sliders are on
//         // have been animated into view.
//         this.calcViewDimensions();

//         if (pointer) {
//           this.tracking = ref;
//         } else {
//           pointer = this.getNearestHandle(event);
//           this.tracking = pointer === this.minH ? 'rzSliderModel' : 'rzSliderHigh';
//         }

//         pointer.addClass('rz-active');

//         if (this.options.keyboardSupport)
//           this.focusElement(pointer);

//         ehMove = angular.bind(this, this.dragging.active ? this.onDragMove : this.onMove, pointer);
//         ehEnd = angular.bind(this, this.onEnd, ehMove);

//         $document.on(eventNames.moveEvent, ehMove);
//         $document.one(eventNames.endEvent, ehEnd);
//         this.callOnStart();
//       },

//       /**
//        * onMove event handler
//        *
//        * @param {jqLite} pointer
//        * @param {Event}  event The event
//        * @returns {undefined}
//        */
//       onMove: function(pointer, event) {
//         var newOffset = this.getEventPosition(event),
//           newValue,
//           ceilValue = this.options.rightToLeft ? this.minValue : this.maxValue,
//           flrValue = this.options.rightToLeft ? this.maxValue : this.minValue;

//         if (newOffset <= 0) {
//           newValue = flrValue;
//         } else if (newOffset >= this.maxPos) {
//           newValue = ceilValue;
//         } else {
//           newValue = this.offsetToValue(newOffset);
//           newValue = this.roundStep(newValue);
//         }
//         this.positionTrackingHandle(newValue);
//       },

//       /**
//        * onEnd event handler
//        *
//        * @param {Event}    event    The event
//        * @param {Function} ehMove   The the bound move event handler
//        * @returns {undefined}
//        */
//       onEnd: function(ehMove, event) {
//         var moveEventName = this.getEventNames(event).moveEvent;

//         if (!this.options.keyboardSupport) {
//           this.minH.removeClass('rz-active');
//           this.maxH.removeClass('rz-active');
//           this.tracking = '';
//         }
//         this.dragging.active = false;

//         $document.off(moveEventName, ehMove);
//         this.scope.$emit('slideEnded');
//         this.callOnEnd();
//       },

//       onPointerFocus: function(pointer, ref) {
//         this.tracking = ref;
//         pointer.one('blur', angular.bind(this, this.onPointerBlur, pointer));
//         pointer.on('keydown', angular.bind(this, this.onKeyboardEvent));
//         pointer.addClass('rz-active');
//       },

//       onPointerBlur: function(pointer) {
//         pointer.off('keydown');
//         this.tracking = '';
//         pointer.removeClass('rz-active');
//       },

//       /**
//        * Key actions helper function
//        *
//        * @param {number} currentValue value of the slider
//        *
//        * @returns {?Object} action value mappings
//        */
//       getKeyActions: function(currentValue) {
//         var increaseStep = currentValue + this.step,
//           decreaseStep = currentValue - this.step,
//           increasePage = currentValue + this.valueRange / 10,
//           decreasePage = currentValue - this.valueRange / 10;

//         //Left to right default actions
//         var actions = {
//           'UP': increaseStep,
//           'DOWN': decreaseStep,
//           'LEFT': decreaseStep,
//           'RIGHT': increaseStep,
//           'PAGEUP': increasePage,
//           'PAGEDOWN': decreasePage,
//           'HOME': this.minValue,
//           'END': this.maxValue
//         };
//         //right to left means swapping right and left arrows
//         if (this.options.rightToLeft) {
//           actions.LEFT = increaseStep;
//           actions.RIGHT = decreaseStep;
//           // right to left and vertical means we also swap up and down
//           if (this.options.vertical) {
//             actions.UP = decreaseStep;
//             actions.DOWN = increaseStep;
//           }
//         }
//         return actions;
//       },

//       onKeyboardEvent: function(event) {
//         var currentValue = this.scope[this.tracking],
//           keyCode = event.keyCode || event.which,
//           keys = {
//             38: 'UP',
//             40: 'DOWN',
//             37: 'LEFT',
//             39: 'RIGHT',
//             33: 'PAGEUP',
//             34: 'PAGEDOWN',
//             36: 'HOME',
//             35: 'END'
//           },
//           actions = this.getKeyActions(currentValue),
//           key = keys[keyCode],
//           action = actions[key];
//         if (action == null || this.tracking === '') return;
//         event.preventDefault();

//         var newValue = this.roundStep(this.sanitizeValue(action));
//         if (!this.options.draggableRangeOnly) {
//           this.positionTrackingHandle(newValue);
//         } else {
//           var difference = this.scope.rzSliderHigh - this.scope.rzSliderModel,
//             newMinValue, newMaxValue;
//           if (this.tracking === 'rzSliderModel') {
//             newMinValue = newValue;
//             newMaxValue = newValue + difference;
//             if (newMaxValue > this.maxValue) {
//               newMaxValue = this.maxValue;
//               newMinValue = newMaxValue - difference;
//             }
//           } else {
//             newMaxValue = newValue;
//             newMinValue = newValue - difference;
//             if (newMinValue < this.minValue) {
//               newMinValue = this.minValue;
//               newMaxValue = newMinValue + difference;
//             }
//           }
//           this.positionTrackingBar(newMinValue, newMaxValue);
//         }
//       },

//       /**
//        * onDragStart event handler
//        *
//        * Handles dragging of the middle bar.
//        *
//        * @param {Object} pointer The jqLite wrapped DOM element
//        * @param {string} ref     One of the refLow, refHigh values
//        * @param {Event}  event   The event
//        * @returns {undefined}
//        */
//       onDragStart: function(pointer, ref, event) {
//         var offset = this.getEventPosition(event);
//         this.dragging = {
//           active: true,
//           value: this.offsetToValue(offset),
//           difference: this.scope.rzSliderHigh - this.scope.rzSliderModel,
//           lowLimit: this.options.rightToLeft ? this.minH.rzsp - offset : offset - this.minH.rzsp,
//           highLimit: this.options.rightToLeft ? offset - this.maxH.rzsp : this.maxH.rzsp - offset
//         };

//         this.onStart(pointer, ref, event);
//       },

//       /**
//        * getValue helper function
//        *
//        * gets max or min value depending on whether the newOffset is outOfBounds above or below the bar and rightToLeft
//        *
//        * @param {string} type 'max' || 'min' The value we are calculating
//        * @param {number} newOffset  The new offset
//        * @param {boolean} outOfBounds Is the new offset above or below the max/min?
//        * @param {boolean} isAbove Is the new offset above the bar if out of bounds?
//        *
//        * @returns {number}
//        */
//       getValue: function(type, newOffset, outOfBounds, isAbove) {
//         var isRTL = this.options.rightToLeft,
//           value = null;

//         if (type === 'min') {
//           if (outOfBounds) {
//             if (isAbove) {
//               value = isRTL ? this.minValue : this.maxValue - this.dragging.difference;
//             } else {
//               value = isRTL ? this.maxValue - this.dragging.difference : this.minValue;
//             }
//           } else {
//             value = isRTL ? this.offsetToValue(newOffset + this.dragging.lowLimit) : this.offsetToValue(newOffset - this.dragging.lowLimit)
//           }
//         } else {
//           if (outOfBounds) {
//             if (isAbove) {
//               value = isRTL ? this.minValue + this.dragging.difference : this.maxValue;
//             } else {
//               value = isRTL ? this.maxValue : this.minValue + this.dragging.difference;
//             }
//           } else {
//             if (isRTL) {
//               value = this.offsetToValue(newOffset + this.dragging.lowLimit) + this.dragging.difference
//             } else {
//               value = this.offsetToValue(newOffset - this.dragging.lowLimit) + this.dragging.difference;
//             }
//           }
//         }
//         return this.roundStep(value);
//       },

//       /**
//        * onDragMove event handler
//        *
//        * Handles dragging of the middle bar.
//        *
//        * @param {jqLite} pointer
//        * @param {Event}  event The event
//        * @returns {undefined}
//        */
//       onDragMove: function(pointer, event) {
//         var newOffset = this.getEventPosition(event),
//           newMinValue, newMaxValue,
//           ceilLimit, flrLimit,
//           isUnderFlrLimit, isOverCeilLimit,
//           flrH, ceilH;

//         if (this.options.rightToLeft) {
//           ceilLimit = this.dragging.lowLimit;
//           flrLimit = this.dragging.highLimit;
//           flrH = this.maxH;
//           ceilH = this.minH;
//         } else {
//           ceilLimit = this.dragging.highLimit;
//           flrLimit = this.dragging.lowLimit;
//           flrH = this.minH;
//           ceilH = this.maxH;
//         }
//         isUnderFlrLimit = newOffset <= flrLimit;
//         isOverCeilLimit = newOffset >= this.maxPos - ceilLimit;

//         if (isUnderFlrLimit) {
//           if (flrH.rzsp === 0)
//             return;
//           newMinValue = this.getValue('min', newOffset, true, false);
//           newMaxValue = this.getValue('max', newOffset, true, false);
//         } else if (isOverCeilLimit) {
//           if (ceilH.rzsp === this.maxPos)
//             return;
//           newMaxValue = this.getValue('max', newOffset, true, true);
//           newMinValue = this.getValue('min', newOffset, true, true);
//         } else {
//           newMinValue = this.getValue('min', newOffset, false);
//           newMaxValue = this.getValue('max', newOffset, false);
//         }
//         this.positionTrackingBar(newMinValue, newMaxValue);
//       },

//       /**
//        * Set the new value and offset for the entire bar
//        *
//        * @param {number} newMinValue   the new minimum value
//        * @param {number} newMaxValue   the new maximum value
//        */
//       positionTrackingBar: function(newMinValue, newMaxValue) {
//         this.scope.rzSliderModel = newMinValue;
//         this.scope.rzSliderHigh = newMaxValue;
//         this.updateHandles('rzSliderModel', this.valueToOffset(newMinValue));
//         this.updateHandles('rzSliderHigh', this.valueToOffset(newMaxValue));
//         this.applyModel();
//       },

//       /**
//        * Set the new value and offset to the current tracking handle
//        *
//        * @param {number} newValue new model value
//        */
//       positionTrackingHandle: function(newValue) {
//         var valueChanged = false;

//         if (this.range) {
//           newValue = this.applyMinRange(newValue);
//           /* This is to check if we need to switch the min and max handles */
//           if (this.tracking === 'rzSliderModel' && newValue > this.scope.rzSliderHigh) {
//             if (this.options.noSwitching && this.scope.rzSliderHigh !== this.minValue) {
//               newValue = this.applyMinRange(this.scope.rzSliderHigh);
//             }
//             else {
//               this.scope[this.tracking] = this.scope.rzSliderHigh;
//               this.updateHandles(this.tracking, this.maxH.rzsp);
//               this.updateAriaAttributes();
//               this.tracking = 'rzSliderHigh';
//               this.minH.removeClass('rz-active');
//               this.maxH.addClass('rz-active');
//               if (this.options.keyboardSupport)
//                 this.focusElement(this.maxH);
//             }
//             valueChanged = true;
//           } else if (this.tracking === 'rzSliderHigh' && newValue < this.scope.rzSliderModel) {
//             if (this.options.noSwitching && this.scope.rzSliderModel !== this.maxValue) {
//               newValue = this.applyMinRange(this.scope.rzSliderModel);
//             }
//             else {
//               this.scope[this.tracking] = this.scope.rzSliderModel;
//               this.updateHandles(this.tracking, this.minH.rzsp);
//               this.updateAriaAttributes();
//               this.tracking = 'rzSliderModel';
//               this.maxH.removeClass('rz-active');
//               this.minH.addClass('rz-active');
//               if (this.options.keyboardSupport)
//                 this.focusElement(this.minH);
//             }
//             valueChanged = true;
//           }
//         }

//         if (this.scope[this.tracking] !== newValue) {
//           this.scope[this.tracking] = newValue;
//           this.updateHandles(this.tracking, this.valueToOffset(newValue));
//           this.updateAriaAttributes();
//           valueChanged = true;
//         }

//         if (valueChanged)
//           this.applyModel();
//       },

//       applyMinRange: function(newValue) {
//         if (this.options.minRange !== 0) {
//           var oppositeValue = this.tracking === 'rzSliderModel' ? this.scope.rzSliderHigh : this.scope.rzSliderModel,
//             difference = Math.abs(newValue - oppositeValue);

//           if (difference < this.options.minRange) {
//             if (this.tracking === 'rzSliderModel')
//               return this.scope.rzSliderHigh - this.options.minRange;
//             else
//               return this.scope.rzSliderModel + this.options.minRange;
//           }
//         }
//         return newValue;
//       },

//       /**
//        * Apply the model values using scope.$apply.
//        * We wrap it with the internalChange flag to avoid the watchers to be called
//        */
//       applyModel: function() {
//         this.internalChange = true;
//         this.scope.$apply();
//         this.callOnChange();
//         this.internalChange = false;
//       },

//       /**
//        * Call the onStart callback if defined
//        * The callback call is wrapped in a $evalAsync to ensure that its result will be applied to the scope.
//        *
//        * @returns {undefined}
//        */
//       callOnStart: function() {
//         if (this.options.onStart) {
//           var self = this;
//           this.scope.$evalAsync(function() {
//             self.options.onStart(self.options.id, self.scope.rzSliderModel, self.scope.rzSliderHigh);
//           });
//         }
//       },

//       /**
//        * Call the onChange callback if defined
//        * The callback call is wrapped in a $evalAsync to ensure that its result will be applied to the scope.
//        *
//        * @returns {undefined}
//        */
//       callOnChange: function() {
//         if (this.options.onChange) {
//           var self = this;
//           this.scope.$evalAsync(function() {
//             self.options.onChange(self.options.id, self.scope.rzSliderModel, self.scope.rzSliderHigh);
//           });
//         }
//       },

//       /**
//        * Call the onEnd callback if defined
//        * The callback call is wrapped in a $evalAsync to ensure that its result will be applied to the scope.
//        *
//        * @returns {undefined}
//        */
//       callOnEnd: function() {
//         if (this.options.onEnd) {
//           var self = this;
//           this.scope.$evalAsync(function() {
//             self.options.onEnd(self.options.id, self.scope.rzSliderModel, self.scope.rzSliderHigh);
//           });
//         }
//       }
//     };

//     return Slider;
//   }])

//   .directive('rzslider', ['RzSlider', function(RzSlider) {
//     'use strict';

//     return {
//       restrict: 'E',
//       scope: {
//         rzSliderModel: '=?',
//         rzSliderHigh: '=?',
//         rzSliderOptions: '&?',
//         rzSliderTplUrl: '@'
//       },

//       /**
//        * Return template URL
//        *
//        * @param {jqLite} elem
//        * @param {Object} attrs
//        * @return {string}
//        */
//       templateUrl: function(elem, attrs) {
//         //noinspection JSUnresolvedVariable
//         return attrs.rzSliderTplUrl || 'rzSliderTpl.html';
//       },

//       link: function(scope, elem) {
//         scope.slider = new RzSlider(scope, elem); //attach on scope so we can test it
//       }
//     };
//   }]);

//   // IDE assist

//   /**
//    * @name ngScope
//    *
//    * @property {number} rzSliderModel
//    * @property {number} rzSliderHigh
//    * @property {Object} rzSliderOptions
//    */

//   /**
//    * @name jqLite
//    *
//    * @property {number|undefined} rzsp rzslider label position offset
//    * @property {number|undefined} rzsd rzslider element dimension
//    * @property {string|undefined} rzsv rzslider label value/text
//    * @property {Function} css
//    * @property {Function} text
//    */

//   /**
//    * @name Event
//    * @property {Array} touches
//    * @property {Event} originalEvent
//    */

//   /**
//    * @name ThrottleOptions
//    *
//    * @property {boolean} leading
//    * @property {boolean} trailing
//    */

//   module.run(['$templateCache', function($templateCache) {
//   'use strict';

//   $templateCache.put('rzSliderTpl.html',
//     "<span class=rz-bar-wrapper><span class=rz-bar></span></span> <span class=rz-bar-wrapper><span class=\"rz-bar rz-selection\" ng-style=barStyle></span></span> <span class=\"rz-pointer rz-pointer-min\" ng-style=minPointerStyle></span> <span class=\"rz-pointer rz-pointer-max\" ng-style=maxPointerStyle></span> <span class=\"rz-bubble rz-limit\"></span> <span class=\"rz-bubble rz-limit\"></span> <span class=rz-bubble></span> <span class=rz-bubble></span> <span class=rz-bubble></span><ul ng-show=showTicks class=rz-ticks><li ng-repeat=\"t in ticks track by $index\" class=rz-tick ng-class=\"{'rz-selected': t.selected}\" ng-style=t.style ng-attr-uib-tooltip=\"{{ t.tooltip }}\" ng-attr-tooltip-placement={{t.tooltipPlacement}} ng-attr-tooltip-append-to-body=\"{{ t.tooltip ? true : undefined}}\"><span ng-if=\"t.value != null\" class=rz-tick-value ng-attr-uib-tooltip=\"{{ t.valueTooltip }}\" ng-attr-tooltip-placement={{t.valueTooltipPlacement}}>{{ t.value }}</span></li></ul>"
//   );

// }]);

//   return module
// }));


(function() {
  "use strict";
  
  /**
   * Create directive called "crfMap" that is applied to module called "IE.crfMap"
   */
  var mapmodule = angular.module("IE.crfMap", [])
  // .factory("RzSliderOptions", RzSliderOptions)
  // .factory("rzThrottle", rzThrottle)
  // .factory("RzSlider", RzSlider)
  // .directive("rzslider", rzslider)
  // .run("run", run)
  .directive("crfMap", crfMap)
  .controller("crfMapCtrl", crfMapCtrl)
  .service("crfMapService", crfMapService);

  crfMap.$inject = ["$compile", "$document", "$rootScope", "crfMapService"];
  /* @ngInject */
  function crfMap($compile, $document, $rootScope, crfMapService) {
    return {
      restrict: "E",
      scope: {
        member: "=",
        crfProvider: "=",
        callback: "&",
        initialview: "=?"
      },
      template: 
        "<div id='container'>" +
          "<div id='mapview' ng-show='view == \"map\"'>" +
            "<div id='mapview-header'>" +
              "<p class='largerIcon'> {{visibleResources.length || 0}} Locations</p>" +
              // "<div id='search'></div>" +
              "<form ng-submit='changeAddress(inputAddress)' id='client-address-input'>" +
                "<input ng-model='inputAddress' type='text' class='form-control' id='inputAddress' placeholder='Enter address'/>" +
              "</form>" +
            "</div>" +
            "<div id='mapcontrols'>" +
              "<div id='toggle'>" +
                "<button id='toggle-button' ng-click='toggle(\"list\")'>List View</button>" +
              "</div>" +
            "</div>" +
            "<div id='map'></div>" +
            "<div id='travel' ng-class='travelOptions.selected ? \"travel-open\" : \"travel-minimized\"'>" +
              "<div ng-class='{\"spinner\":travelSlider.options.disabled}'></div>" +
              "<img ng-click='travelOptions.selected = !travelOptions.selected; loadTravelRadius(member, \"drive\", travelSlider.value)' ng-if='travelOptions.selected == false' src='https://rawgit.com/savtwo/esri-map/master/radius_pin_small.png' width='40' height='40'>" +
              "<img id='travel-icons' ng-class='{\"travel-type-icon\":!travelSlider.options.disabled, \"travel-type-icon-disabled\":travelSlider.options.disabled}' ng-click='loadTravelRadius(member, \"drive\", travelSlider.value)' ng-if='travelOptions.selected == true && travelOptions.type != \"drive\"' src='https://rawgit.com/savtwo/esri-map/master/drive_off.png'>" +
              "<img id='travel-icons' ng-class='{\"travel-type-icon\":!travelSlider.options.disabled, \"travel-type-icon-disabled\":travelSlider.options.disabled}' ng-if='travelOptions.selected == true && travelOptions.type == \"drive\"' src='https://rawgit.com/savtwo/esri-map/master/drive_on.png'>" +
              "<img id='travel-icons' ng-class='{\"travel-type-icon-walk\":!travelSlider.options.disabled, \"travel-type-icon-walk-disabled\":travelSlider.options.disabled}' ng-click='loadTravelRadius(member, \"walk\", travelSlider.value)' ng-if='travelOptions.selected == true && travelOptions.type != \"walk\"' src='https://rawgit.com/savtwo/esri-map/master/walk_off.png' height='32'>" +
              "<img id='travel-icons' ng-class='{\"travel-type-icon-walk\":!travelSlider.options.disabled, \"travel-type-icon-walk-disabled\":travelSlider.options.disabled}' ng-if='travelOptions.selected == true && travelOptions.type == \"walk\"' src='https://rawgit.com/savtwo/esri-map/master/walk_on.png' height='32'>" +
              // "<rzslider rz-slider-model='travelSlider.value' rz-slider-options='travelSlider.options'></rzslider>" +
              // "<datalist id='steplist'>" +
              //   "<option class='steplist-option'>0</option>" +
              //   "<option class='steplist-option'>5</option>" +
              //   "<option class='steplist-option'>10</option>" +
              //   "<option class='steplist-option'>15</option>" +
              //   "<option class='steplist-option'>20</option>"+
              //   "<option class='steplist-option'>25</option>" +
              //   "<option class='steplist-option'>30</option>" +
              //   "<option class='steplist-option'>35</option>"+
              //   "<option class='steplist-option'>40</option>" +
              //   "<option class='steplist-option'>45</option>" +
              //   "<option class='steplist-option'>50</option>"+
              //   "<option class='steplist-option'>55</option>" +
              //   "<option class='steplist-option'>60</option>" +
              // "</datalist>"+
              "<input ng-disabled='travelSlider.options.disabled' type='range' step='5' min='5' max='60' ng-value='travelSlider.value' id='travel-radius-slider' ng-model='travelSlider.value' ng-mouseup='loadTravelRadius(member, travelOptions.type, value)'/>" +
              "<span ng-show='travelOptions.selected' id='slidervalue'>{{travelSlider.value}} minutes</span>" +
              "<img ng-class='{\"travel-toggle-icon\":!travelSlider.options.disabled, \"travel-toggle-icon-disabled\":travelSlider.options.disabled}' ng-click='travelOptions.selected = !travelOptions.selected; clearTravelRadius(map)' ng-if='travelOptions.selected == true' src='https://rawgit.com/savtwo/esri-map/master/radius_pin_small.png' width='40' height='40'>" +
            "</div>" +
            "<div id='detailsview' ng-if='show'>" +
              "<div class='detailsview-header'>" +
                "<span class='detailsview-name'>{{attrs.Name}}</span><span ng-click='closeDetails(false)' class='close-list'>X</span>" +
              "</div><br/>" +
              "Category: {{attrs.ServiceCategory}}<br/>" +
              "Service Type: {{attrs.ServiceType}}<br/><br/>" +
              "Address: {{attrs.AddressSingle}}<br/>" +
              "Phone: {{attrs.Phone || None}}<br/>" +
              "Email: {{attrs.Email || None}}<br/>" +
              "Hours: {{attrs.Hours || None}}<br/>" +
              "Website: {{attrs.Website || None}}<br/>" +
              "Tags: {{attrs.SearchTags}}<br/><br/>" +
              "<button class='provider-select' ng-click='provider(attrs)'>Select Provider</button>" +
            "</div>" +
          "</div>" +
          "<div id='listview-wrapper' ng-show='view == \"list\"'>" +
            "<div id='listview-header'>" +
              "<p class='largerIcon'> {{visibleResources.length || 0}} Locations</p>" +
              "<input ng-model='search.attributes.$' type='text' class='form-control searchFilter' placeholder='Search'/>" +
              "<form ng-submit='updateAddress(inputAddress)' id='client-address-input'>" +
                "<input ng-model='inputAddress' type='text' class='form-control' id='inputAddressList' placeholder='Enter address'/>" +
              "</form>" +
            "</div>" +
            "<div id='listcontrols'>" +
              "<div id='toggle'>" +
                "<select id='sort' ng-model='sortType'>" +
                  "<option ng-click='sortType = \"attributes.Name\"' value='attributes.Name'>Name</option>" +
                  "<option ng-click='sortType = \"attributes.Time\"' value='attributes.Time'>Time</option>" +
                  "<option ng-click='sortType = \"attributes.Distance\"' value='attributes.Distance'>Distance</option>" +
                "</select>" +
                "<button id='toggle-button' ng-click='toggle(\"map\")'>Map View</button>" +
              "</div>" +
            "</div>" +
            "<div id='listcontainer'>" +
              "<div id='listtable'>" +
                "<table class='table table-listview'>" +
                  "<thead style='text-align: center'>" +
                    "<th width='33.3%'>Name</th>"+
                    "<th width='33.3%'>Address</th>"+
                    "<th width='33.3%'>Distance | Time</th>"+
                  "</thead>" +
                  "<tbody ng-repeat='resource in visibleResources | orderBy:sortType | filter:search as resources'>" +
                    "<tr>" +
                      "<td><h6 class='listview-h1'><span>{{resource.attributes.Name}}</span></h6></td>" +
                      "<td><p>{{resource.attributes.AddressSingle}}</p></td>" +
                      "<td class='distance' ng-if='resource.attributes.Distance'>" +
                        "{{resource.attributes.Distance | number:2}} mi | {{resource.attributes.Time}} minutes" +
                      "</td>" +
                      "<td ng-if='!resource.attributes.Distance'>Unknown distance</td>" +  
                    "</tr>" +
                    "<tr>" +
                      "<td><button class='provider-select' ng-click='provider(resource.attributes)'>Select Provider</button></td>" +
                      "<td>Phone: {{resource.attributes.Phone || 'Not found'}}</td>" +
                      "<td></td>" +    
                    "</tr>" +
                  "</tbody>" +
                  "<tbody ng-if='resources.length == 0'>" +
                    "<tr>" +
                      "<td width='100%'>" +
                        "No Resources Found" +
                      "</td" +
                    "</tr" +
                  "</tbody>" +
                "</table>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>",
      controller: "crfMapCtrl",
      controllerAs: "c",
      link: postLink
    };
    
    function postLink($scope, ele, attrs, ctrl) {
      $scope.$watchGroup(["crfProvider", "member"], function(newVal, oldVal) {
        var newMember = $scope.member;
        var newProvider = $scope.crfProvider;
        if(typeof $scope.initialview == "undefined") {
          $scope.initialview = "map"
        }
        $scope.view = $scope.initialview;
        
        if (newMember && !newProvider) {
          var defExp = crfMapService.getProviders(newMember.needs[0].details);
          $scope.centerMap(newMember.needs[0].addresses[0]);
          $scope.show = false;
          $scope.travelOptions.selected = false;
          $scope.inputAddress = newMember.needs[0].addresses[0].ADR_LN_1_TXT + " " + newMember.needs[0].addresses[0].ADR_LN_2_TXT + ", " + newMember.needs[0].addresses[0].CTY_NM + ", " + newMember.needs[0].addresses[0].ST + " " + newMember.needs[0].addresses[0].ZIP;

          createFeatureLayer(defExp);
        }
        
        if (newProvider) {
          var address = newProvider.ADR_LN_1_TXT + ", " + newProvider.CTY_NM + ", " + newProvider.ST + " " + newProvider.ZIP;
          var defExp = crfMapService.getProviders(newMember.needs[0].details);
          $scope.centerMap(address);
          $scope.show = true;

          crfMapService.getProviderById(newProvider).then(function(response) {
            var layer = $scope.map.getLayer("resources");
            $scope.attrs = response.features[0].attributes;
            newProvider.geometry = response.features[0].geometry;

            require(["esri/tasks/query"], function(Query) {
              var query = new Query();
              query.objectIds = [newProvider.id];
              query.outFields = ["*"];

              layer.queryFeatures(query, function(results) {
                var res = results.features[0];

                if (!res) {
                  return;
                }

                if (res.geometry.x == "NaN" || res.geometry.y == "NaN") {
                  return;
                }

                showBack($scope.map, res);
              });
            });
          });
          
          createFeatureLayer(defExp);
        }
        
        if (newProvider && newMember.provider == null) {
          $scope.centerMap(newMember.needs[0].addresses[0]);
          $scope.inputAddress = newMember.needs[0].addresses[0].ADR_LN_1_TXT + " " + newMember.needs[0].addresses[0].ADR_LN_2_TXT + ", " + newMember.needs[0].addresses[0].CTY_NM + ", " + newMember.needs[0].addresses[0].ST + " " + newMember.needs[0].addresses[0].ZIP;
          $scope.show = false;
          $scope.travelOptions.selected = false;
        }
      });

      function createFeatureLayer(defExp) {
        require(["esri/graphic", "esri/symbols/PictureMarkerSymbol", "esri/geometry/Point", "esri/tasks/FeatureSet", 
        "esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer"], 
        function(Graphic, PictureMarkerSymbol, Point, FeatureSet, FeatureLayer, SimpleFillSymbol, Color, SimpleRenderer) {
          if ($scope.map.graphics) {
            $scope.map.graphics.clear();
            $scope.map.getLayer("travelRadius").clear();
            $scope.resourcesLayer.setDefinitionExpression(defExp);
          }
        });
      }
      
      require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol", "esri/InfoTemplate", "esri/graphic", "esri/geometry/Point", "esri/tasks/FeatureSet", "esri/tasks/ServiceAreaParameters", "esri/tasks/ServiceAreaTask", "esri/layers/GraphicsLayer"], 
      function getMap(Map, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SimpleRenderer, PictureMarkerSymbol, InfoTemplate, Graphic, Point, FeatureSet, ServiceAreaParameters, ServiceAreaTask, GraphicsLayer) {
        var template = new InfoTemplate();
        $scope.map = new Map("map", crfMapService.attributes.options);
        crfMapService.loadSearchWidget($scope.map);
        
        // resourcesLayer properties
        $scope.resourcesLayer = new FeatureLayer("https://healthstate-stg.optum.com/arcgis/rest/services/crf/OCRF_LocationsFlat_repl/MapServer/0", {
          id: "resources",
          infoTemplate: template,
          outFields: ["*"]
        });

        var pms = new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25);
        var renderer = new SimpleRenderer(pms);
        $scope.resourcesLayer.setSelectionSymbol(pms);
        $scope.resourcesLayer.setRenderer(renderer);

        // travelRadiusLayer properties
        var travelRadiusLayer = new GraphicsLayer({
          id: "travelRadius",
          address: "13625 Technology Dr, Eden Prairie, MN 55346"
        });

        // adding layers to map
        $scope.map.addLayer($scope.resourcesLayer);
        $scope.map.addLayer(travelRadiusLayer, 0);

        $scope.resourcesLayer.on("update-end", function(evt) {
          $scope.visibleResources = evt.target.graphics;
          if ($scope.visibleResources && $scope.member) {
            if($scope.member.point) {
              $scope.visibleResources.forEach(function(Resource) {
                crfMapService.calculateDistanceAndTime($scope.member.point, Resource);
              });
            }
          }
        })
        
        $scope.map.on("click", function(evt) {
          if (!evt.graphic) {
            return;
          }

          showDetails(evt.graphic, true);
        });
      });

      function showBack(map, feature) {
        var $scope = $rootScope.$new(true);
        
        var el = $compile()($scope);
        map.infoWindow.setFeatures([feature]);
        map.infoWindow.show(feature.geometry);

        var contentPane = $document.find(".esriPopup .contentPane");
        var contentElement = angular.element(contentPane);

        contentElement.html("");
        contentElement.append(el);
      }      

      function showDetails(feature, show) {
        var scope = $rootScope.$new(true);
        scope.selectProvider = selectProvider;
        scope.showDetails = showDetails;
        
        $scope.attrs = feature.attributes;
        if(feature.attributes.Shape_Area || feature.attributes.Shape_Length) {
          $scope.show = false
        } else {
          $scope.show = show;
        }
        
        if(!$rootScope.$$phase) {
          $rootScope.$digest();
        }
        
        function selectProvider(provider) {
          $scope.provider(provider);
        }
      }
    }
  }
  
  crfMapCtrl.$inject = ["$scope", "$timeout", "crfMapService"];
  /* @ngInject */
  function crfMapCtrl($scope, $timeout, crfMapService) {
    $scope.centerMap = centerMap;
    $scope.clearTravelRadius = crfMapService.clearTravelRadius;
    $scope.changeAddress = changeAddress;
    $scope.closeDetails = closeDetails;
    $scope.loadTravelRadius = loadTravelRadius;
    $scope.map = crfMapService.attributes;
    $scope.mapData = crfMapService.mapData;
    $scope.provider = provider;
    $scope.toggle = toggle;
    $scope.travelOptions = {
      selected: false,
      type: "drive"
    };
    $scope.travelSlider = {
      value: 20,
      options: {
        id: "travel-radius-slider",
        floor: 0,
        ceil: 60,
        step: 5,
        showTicks: true,
        showSelectionBarFromValue: 0,
        getSelectionBarColor: function() {
          return "#888b8d";
        },
        disabled: false,
        onEnd: function(id, value) {
          $scope.loadTravelRadius($scope.member, $scope.travelOptions.type, value);
        }
      }
    };
    $scope.view = $scope.initialview;
    $scope.sortType = "attributes.Time"
    $scope.search= "";
    $scope.updateAddress = updateAddress;
    
    function centerMap(address) {
      
      var memberPoint = crfMapService.geocode(address).then(success, fail);
      
      function center(pt) {
        $timeout(function() {
          $scope.map.centerAndZoom(pt, 11);
        });
      }
      
      function success(res) {
        $scope.member.point = res.point;
        center(res.point);
      }
      
      function fail(res) {
      }
    }

    function changeAddress(address) {
      if($scope.travelOptions.selected == false) {
        $scope.travelOptions.selected = true;
      }
      crfMapService.geocode(address).then(success, fail);

      function success(response) {
        $scope.member.point = response.point;
        $scope.travelSlider.options.disabled = true;
        crfMapService.loadTravelRadius($scope.map, $scope.member, $scope.travelSlider.value, $scope.travelOptions.type).then(success, fail);

        function success() {
          $scope.travelSlider.options.disabled = false;
        }

        function fail() {
          $scope.travelSlider.options.disabled = false;
          window.alert("Member's address could not be located.");
        }
      }

      function fail(response) {

      }
    }
    
    function closeDetails(show) {
      $scope.show = show;
    }

    function loadTravelRadius(member, type, minutes) {
      $scope.travelSlider.options.disabled = true;
      
      if (type) {
        $scope.travelOptions.type = type;
      }
      
      if (minutes) {
        $scope.travelSlider.value = minutes;
      }
      
      crfMapService.loadTravelRadius($scope.map, $scope.member, $scope.travelSlider.value, $scope.travelOptions.type).then(success, fail);
      
      function success() {
        $scope.travelSlider.options.disabled = false;
      }
      
      function fail() {
        $scope.travelSlider.options.disabled = false;
        window.alert("Member's address could not be located.");
      }
    }
    
    function provider(provider) {
      var requestedData = {
        transactionId: $scope.member.transactionId,
        needs: [
          {
            clientId: $scope.member.needs[0].clientId,
            firstName: $scope.member.needs[0].firstName,
            lastName: $scope.member.needs[0].lastName,
            addresses: $scope.member.needs[0].addresses,
            details: [
              {
                detailId: $scope.member.needs[0].details[0].detailId,
                program: $scope.member.needs[0].details[0].filter,
                provider: {
                  id: provider.OBJECTID,
                  name: provider.Name,
                  address: provider.AddressSingle,
                  ADR_ID: "ADR_ID_TEST",
                  ADR_LN_1_TXT: provider.Address,
                  ADR_LN_2_TXT: "ADR_LN_2_TXT_TEST",
                  CTY_NM: provider.City,
                  ST: provider.State,
                  ZIP: provider.Zip_Code,
                  ZIP_EXT: "ZIP_EXT",
                  FGN_PRVC_NM: "FGN_PRVC_NM",
                  FGN_PST_CD: "FGN_PST_CD",
                  CNTY: "CNTRY",
                  ADR_TYP_CD: "ADR_TYP_CD",
                  IN_JAIL_OR_INST_BY_THS_ST: "IN_JAIL_OR_INST_BY_THS_ST",
                  ADR_SPEC_CD: "ADR_SPEC_CD",
                  JAIL_OR_INST_ADR_FLG: "JAIL_OR_INST_ADR_FLG",
                  phone: provider.Phone,
                  website: provider.Website,
                  geometry: provider.geometry
                }
              }
            ]
          }
        ]
      };      
      $scope.callback()(requestedData);        
    }

    function toggle(view) {
      $scope.view = view;
      $scope.centerMap
    }

    function updateAddress(address) {
      crfMapService.geocode(address).then(success, fail);

      function success(response) {
        $scope.member.point = response.point;
        $scope.visibleResources.forEach(function(Resource) {
          crfMapService.calculateDistanceAndTime($scope.member.point, Resource);
        });
      }

      function fail(response) {
        window.alert("Member's address could not be located");
      }
    }
  }
  
  crfMapService.$inject = ["$compile", "$document", "$http", "$q", "$rootScope", "$timeout"];
  /* @ngInject */
  function crfMapService($compile, $document, $http, $q, $rootScope, $timeout) {
    var self = this;
    
    self.attributes = {
      id: "map",
      options: {
        basemap: "topo",
        center: [-93.45536540319006, 44.85786213722895],
        zoom: 11
      },
      resourcesLayerUrl: "https://healthstate-stg.optum.com/arcgis/rest/services/crf/OCRF_LocationsFlat_repl/MapServer/0",
      resourcesOptions: {
        id: "resources",
        outFields: ["*"]
      },      
      travelRadiusOptions: {
        id: "travelRadius",
        address: "13625 Technology Dr, Eden Prairie, MN 55346",
        lastTravelType: undefined,
        lastTravelMinutes: undefined,
        visible: false
      }      
    };
    self.calculateDistanceAndTime = calculateDistanceAndTime;
    self.clearTravelRadius = clearTravelRadius;
    self.geocode = geocode;
    self.getMap = getMap;
    self.getProviderById = getProviderById;
    self.getProviders = getProviders;
    self.loadTravelRadius = loadTravelRadius;
    self.mapLoaded = mapLoaded;
    self.loadSearchWidget = loadSearchWidget;

    /**
     * Calculate the distance and travel time between two points.
     */
    function calculateDistanceAndTime(address, resource) {
      require([
        "esri/geometry/Point",
        "esri/graphic",
        "esri/tasks/DistanceParameters",
        "esri/tasks/FeatureSet",
        "esri/tasks/GeometryService",
        "esri/tasks/RouteParameters",
        "esri/tasks/RouteTask",
        "esri/units",
        "esri/geometry/webMercatorUtils"
        ],
      function(Point, Graphic, DistanceParameters, FeatureSet, GeometryService, RouteParams, RouteTask, Units, webMercatorUtils) {
        var addressPoint = new Point(address.x, address.y);
        var distParams = new DistanceParameters();
        var geometryService = new GeometryService("https://map-stg.optum.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
        
        var resourcePoint = new Point(resource.geometry.x, resource.geometry.y);
        if (Math.abs(resource.geometry.x) > 360) {
          var latlng = webMercatorUtils.xyToLngLat(resource.geometry.x, resource.geometry.y);
          resourcePoint = new Point(latlng[0], latlng[1]);
        }
        var routeParams = new RouteParams();
        var routeTask = new RouteTask("https://healthstate.optum.com/arcgis/rest/services/Routing/Routes/NAServer/FindRoutes");

        distParams.distanceUnit = GeometryService.UNIT_STATUTE_MILE;
        distParams.geometry1 = addressPoint;
        distParams.geometry2 = resourcePoint;
        distParams.geodesic = true;
        distParams.f = "json";
        
        routeParams.stops = new FeatureSet();
        routeParams.stops.features.push(new Graphic(addressPoint));
        routeParams.stops.features.push(new Graphic(resourcePoint));
        routeParams.directionsLengthUnits = Units.MILES;
        
        /** Retrieve distance and set it in the resource attributes object */
        geometryService.distance(distParams, function(distance) {
          $timeout(function() {
            resource.attributes.Distance = distance;
          });
        });
        
        /** Retrieve time and set it in the resource attributes object */
        routeTask.solve(routeParams, function(time) {
          $timeout(function() {
            resource.attributes.Time = Math.round(time.routeResults[0].route.attributes.Total_TravelTime);
          });
        });
      });
    }

    function clearTravelRadius(map) {
        var travelRadiusLayer = map.getLayer(self.attributes.travelRadiusOptions.id);
        travelRadiusLayer.clear();
    }
    
    /**
     * Geocode address.
     */
    function geocode(address, extentMulti) {
      var deferred = $q.defer();
      
      if (address instanceof Object) {
        address = address.ADR_LN_1_TXT + " " + address.ADR_LN_2_TXT + ", " + address.CTY_NM + ", " + address.ST + " " + address.ZIP;
      }
      
      if (typeof address !== "string") {
        deferred.reject();
        return;
      }
      
      require(["esri/tasks/locator"], function(Locator) {
        var locator = new Locator("https://healthstate.optum.com/arcgis/rest/services/USA/GeocodeServer");
        var locatorParams = {};
        
        if (extentMulti && map.extent) {
          locatorParams.searchExtent = map.extent.expand(extentMulti);
        }
        locatorParams.address = {
          "SingleLine": address
        };
        
        // geocode address to location X/Y
        locator.addressToLocations(locatorParams, function(res) {
          if (res.length === 0) {
            deferred.reject();
            return;
          }
          
          deferred.resolve({
            point: res[0].location,
            address: address
          });
        });
      });
      
      return deferred.promise;
    }
    
    /**
     * Return the deferred map.
     */
    function getMap() {
      return esriRegistry.get(self.attributes.id);
    }
    
    function getProviderById(provider) {
      var qs = {
        where: "1=1",
        objectIds: provider.id,
        outFields: "*",
        returnGeometry: true,
        returnIdsOnly: false,
        returnCountOnly: false,
        returnZ: false,
        returnM: false,
        returnDistinctValues: false,
        returnTrueCurves: false,
        resultRecordCount: 100,
        f: "pjson"
      };

      return $http.get("https://healthstate-stg.optum.com/arcgis/rest/services/crf/OCRF_LocationsFlat_repl/MapServer/0/query", { params: qs }).then(success, fail);
      
      function success(response) {
        return response.data;
      }
      
      function fail(response) {
        return response.data;
      }      
    }
    
    function getProviders(details) {
      var serviceType = [];
      var qs = {};
      var defExp;
      
      if (details[0].allowUpdate == false && details[0].providerId) {
        var str = "ObjectId = " + details[0].providerId;
        qs.objectIds = str;
      }
      
      details.forEach(function(detail) {
        serviceType.push(mapData(detail.filter));
      });
      
      var str = "ServiceType IN ('" + serviceType.join("', '") + "')";
      qs.where = str;

      if (qs.objectIds) {
        defExp = qs.where + " AND " + qs.objectIds;
      } else {
        defExp = qs.where;
      }
      
      return defExp;
    }

    function loadTravelRadius(map, member, minutes, travelType) {
      var deferred = $q.defer();

      require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol", "esri/InfoTemplate", "esri/graphic", "esri/geometry/Point", "esri/tasks/FeatureSet", "esri/tasks/ServiceAreaParameters", "esri/tasks/ServiceAreaTask", "esri/layers/GraphicsLayer"], 
      function(Map, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SimpleRenderer, PictureMarkerSymbol, InfoTemplate, Graphic, Point, FeatureSet, ServiceAreaParameters, ServiceAreaTask, GraphicsLayer) {

        if(typeof member.point == "undefined") {
          window.alert("Member's address could not be located.");
          deferred.resolve();
          return;
        }

        if (!minutes) {
          deferred.resolve();
          return;
        }
      
        if (minutes === 0) {
          minutes = self.attributes.travelRadiusOptions.lastTravelMinutes;
        }
        
        var travelRadiusLayer = map.getLayer(self.attributes.travelRadiusOptions.id);

        if (travelType == 'walk') {
          minutes = minutes / 4; 
        }

        var pointSymbol = new SimpleMarkerSymbol("diamond", 20,
          new SimpleLineSymbol("solid", new Color([88, 116, 152]), 2),
          new Color([88, 116, 152, 0.45])
        );
        
        var location = new Graphic(member.point, pointSymbol);
        
        var features = [];
        features.push(location);
        
        var facilities = new FeatureSet();
        facilities.features = features;
        
        var serviceAreaParams = new ServiceAreaParameters();
        serviceAreaParams.outSpatialReference = map.spatialReference;          
        serviceAreaParams.defaultBreaks= [minutes];
        serviceAreaParams.returnFacilities = false;
        serviceAreaParams.facilities = facilities;

        var serviceAreaTask = new ServiceAreaTask("https://healthstate.optum.com/arcgis/rest/services/Routing/ServiceAreas/NAServer/GenerateServiceAreas");

        //solve 
        serviceAreaTask.solve(serviceAreaParams, function(solveResult){
          var polygonSymbol = new SimpleFillSymbol(
            "solid",  
            new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2),
            new Color([232, 104, 80, 0.25])
          );
          
          solveResult.serviceAreaPolygons.forEach(function(serviceArea){
            serviceArea.setSymbol(polygonSymbol);
            travelRadiusLayer.clear();
            travelRadiusLayer.add(serviceArea);
            travelRadiusLayer.add(location);
          });
          map.addLayer(travelRadiusLayer);
          map.centerAt(member.point);
          self.attributes.travelRadiusOptions.lastTravelType = travelType;
          self.attributes.travelRadiusOptions.lastTravelMinutes = minutes;
          deferred.resolve();
        }, function(err){
          console.log(err.message);
          deferred.reject();
          return;
        });
      });

      return deferred.promise;
    }

    /**
     * Fire when the resources map is loaded.
     */
    function mapLoaded(map) {
      addTravelLayer();
      hidePopupOnClick();

      function addTravelLayer() {
        esriLoader.require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
          var travelRadiusLayer = new GraphicsLayer({
            id: self.attributes.travelRadiusOptions.id
          });
          
          $q.all([self.attributes.resourcesDeferred.promise, self.attributes.suggestedDeferred.promise]).then(function() {
            map.addLayer(travelRadiusLayer, 1);
            travelRadiusLayer.setVisibility(self.attributes.travelRadiusOptions.visible);
      
            travelRadiusLayer.on("click", function(evt) {
              // travel radius polygon has attributes, but the central point does not.
              if (evt.graphic.attributes) {
                map.infoWindow.hide();
                return;
              }
              
              showAddressPopup(evt.graphic.geometry);
            });
          });
        });
      }
			
      /**
       * Hide the map's popup window is not clicked on a graphic.
       */
      function hidePopupOnClick() {
        map.on("click", function(evt) {
          if (evt.graphic) {
            return;
          }

          map.infoWindow.hide();
        });
      }
    }

    function mapData(serviceType) {
      if (serviceType == "CCAP") {
        return serviceType = "Child Care";
      }

      if (serviceType == "TANF" || serviceType == "SNAP") {
        return serviceType = "Job Placement Services";
      }

      if (serviceType == "LiHEAP") {
        return serviceType = "Utility Assistance";
      }

      if (serviceType == "QHP" || serviceType == "CHIP" || serviceType == "MEDI" || serviceType == "Medicaid") {
        return serviceType = "Medical";
      }

      return serviceType;
    }

    /**
     * Load the map's search widget.
     */
    function loadSearchWidget(map) {
        require(["esri/layers/FeatureLayer", "esri/symbols/PictureMarkerSymbol", "dijit/registry", "esri/dijit/Search"], function(FeatureLayer, PictureMarkerSymbol, Registry, Search) {
          var searchId = "search";
          var sources = [];

          var existingSearch = Registry.byId(searchId);
          if (existingSearch) {
            existingSearch.destroy();
          }
          
          sources.push({
            suggestionTemplate: "${Name}\n - ${ServiceType}",
            enableLabel: false,
            enableHighlight: true,
            enableInfoWindow: false,
            exactMatch: false,
            featureLayer: new FeatureLayer(self.attributes.resourcesLayerUrl),
            highlightSymbol: new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25).setOffset(0, 9),
            // suffix: "%' AND ValidationStatus LIKE '%Accept%'", // hack to modify sql string to accept State, could not get other search properties to work
            outFields: ["*"],
            placeholder: "Search Resources...",
            searchFields: ["Name", "ServiceType", "SearchTags", "ServiceCategory", "FilterTags", "City", "State", "Zip_Code"]
          });

          var search = new Search({
            map: map,
            sources: sources
          }, searchId);
          search.startup();
          
          // search.on("select-result", function(evt) {
          //   showDetails(evt.result.feature, evt.result.feature.geometry);
          // });
        });
    }
  }
})();