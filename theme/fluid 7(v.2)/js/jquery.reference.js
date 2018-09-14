/**
 * @preserve Flux Slider v1.4.4
 * http://www.joelambert.co.uk/flux
 *
 * Copyright 2011, Joe Lambert.
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

// Flux namespace
window.flux = {
	version: '1.4.4'
};
var width,height,column,row,delay,index;
(function($){
	flux.slider = function(elem, opts) {
		// Setup the flux.browser singleton to perform feature detection
		flux.browser.init();

		if(!flux.browser.supportsTransitions)
		{
			if(window.console && window.console.error)
				console.error("Flux Slider requires a browser that supports CSS3 transitions");
		}

		var _this = this;

		this.element = $(elem);

		// Make a list of all available transitions
		this.transitions = [];
		for(var fx in flux.transitions)
			this.transitions.push(fx);

		this.options = $.extend({
			autoplay: true,
			transitions: this.transitions,
			delay: 4000,
			column:4,
			index:0,
			tdelay:200,
			pagination: true,
			controls: false,
			captions: false,
			width: null,
			height: null,
			onTransitionEnd: null
		}, opts);

		// Set the height/width if given [EXPERIMENTAL!]
		this.height = this.options.height ? this.options.height	: null;
		this.width 	= this.options.width  ? this.options.width 	: null;
		width=this.width;
		height=this.height;
		column=opts.column;
		row=opts.row;
		delay=opts.tdelay;
		index=(opts.index)?opts.index:0;
		// Filter out non compatible transitions
		var newTrans = [];
		$(this.options.transitions).each(function(index, tran){
			var t = new flux.transitions[tran](this),
				compatible = true;
			
			if(t.options.requires3d && !flux.browser.supports3d)
				compatible = false;
				
			if(t.options.compatibilityCheck)
				compatible = t.options.compatibilityCheck();

			if(compatible)
				newTrans.push(tran);
		});		

		this.options.transitions = newTrans;

		this.images = new Array();
		this.imageLoadedCount = 0;
		this.currentImageIndex = 0;
		this.nextImageIndex = 1;
		this.playing = false;


		this.container = $('<div class="fluxslider"></div>').appendTo(this.element);
		
		this.surface = $('<div class="surface" style="position: relative"></div>').appendTo(this.container);
		
		// Listen for click events as we may want to follow a link
		this.container.bind('click', function(event) {
			if($(event.target).hasClass('hasLink'))
				window.location = $(event.target).data('href');
		});

		this.imageContainer = $('<div class="images loading"></div>').css({
			'position': 'relative',
			'overflow': 'hidden',
			'min-height': '100px'
		}).appendTo(this.surface);
		
		// If the height/width is already set then resize the container
		if(this.width && this.height)
		{
			this.imageContainer.css({
				width: this.width+'px',
				height: this.height+'px'
			});
		}

		// Create the placeholders for the current and next image
		this.image1 = $('<div class="image1" style="height: 100%; width: 100%;background-size:100% 100%;"></div>').appendTo(this.imageContainer);
		this.image2 = $('<div class="image2" style="height: 100%; width: 100%;background-size:100% 100%;"></div>').appendTo(this.imageContainer);

		$(this.image1).add(this.image2).css({
			'position': 'absolute',
			'top': '0px',
			'left': '0px'
		});
		
		// Get a list of the images to use
		this.element.find('img, a img').each(function(index, found_img){
			var imgClone = found_img.cloneNode(false),
				link = $(found_img).parent();

			// If this img is directly inside a link then save the link for later use
			if(link.is('a'))
				$(imgClone).data('href', link.attr('href'));

			_this.images.push(imgClone);

			// Remove the images from the DOM
			$(found_img).remove();
		});
		
		// Load the images afterwards as IE seems to load images synchronously
		for(var i=0; i<this.images.length; i++) {
			var image = new Image();
			image.onload = function() {
				_this.imageLoadedCount++;

				_this.width  = _this.width 	? _this.width  : this.width;
				_this.height = _this.height ? _this.height : this.height;

				if(_this.imageLoadedCount >= _this.images.length)
				{
					_this.finishedLoading();
					_this.setupImages();
				}
			};

			// Load the image to ensure its cached by the browser
			image.src = this.images[i].src;
		}
		
		// Catch when a transition has finished
		this.element.bind('fluxTransitionEnd', function(event, data) {
			// If the slider is currently playing then set the timeout for the next transition
			// if(_this.isPlaying())
			// 	_this.start();
			
			// Are we using a callback instead of events for notifying about transition ends?
			if(_this.options.onTransitionEnd) {					
				event.preventDefault();
				_this.options.onTransitionEnd(data);
			}
		});

		// Should we auto start the slider?
		if(this.options.autoplay)
			this.start();
			
		// Handle swipes
		this.element.bind('swipeLeft', function(event){
			_this.next(null, {direction: 'left'});
		}).bind('swipeRight', function(event){
			_this.prev(null, {direction: 'right'});
		});
		
		// Under FF7 autoplay breaks when the current tab loses focus
		setTimeout(function(){
			$(window).focus(function(){
				if(_this.isPlaying())
					_this.next();
			});
		}, 100);
	};

	flux.slider.prototype = {
		constructor: flux.slider,
		playing: false,
		start: function() {
			var _this = this;
			this.playing = true;
			this.interval = setInterval(function() {
				console.log('play');
				_this.transition();
			}, this.options.delay);
		},
		stop: function() {
			this.playing = false;
			clearInterval(this.interval);
			this.interval = null;
		},
		isPlaying: function() {
			return this.playing;
			//return this.interval != null;
		},
		next: function(trans, opts) {
			opts = opts || {};
			opts.direction = 'left';
			this.showImage(this.currentImageIndex+1, trans, opts);
		},
		prev: function(trans, opts) {
			opts = opts || {};
			opts.direction = 'right';
			this.showImage(this.currentImageIndex-1, trans, opts);
		},
		showImage: function(index, trans, opts) {
			this.setNextIndex(index);
			
			// Temporarily stop the transition interval
			//clearInterval(this.interval);
			//this.interval = null;
			
			this.setupImages();
			this.transition(trans, opts);
		},  
		finishedLoading: function() {
			var _this = this;

			this.container.css({
				width: this.width+'px',
				height: this.height+'px'
			});

			this.imageContainer.removeClass('loading');

			// Should we setup a pagination view?
			if(this.options.pagination)
			{
				// TODO: Attach to touch events if appropriate
				this.pagination = $('<ul class="pagination"></ul>').css({
					margin: '0px',
					padding: '0px',
					'text-align': 'center'
				});

				this.pagination.bind('click', function(event){
					event.preventDefault();
					_this.showImage($(event.target).data('index'));
				});

				$(this.images).each(function(index, image){
					var li = $('<li data-index="'+index+'">'+(index+1)+'</li>').css({
						display: 'inline-block',
						'margin-left': '0.5em',
						'cursor': 'pointer'
					}).appendTo(_this.pagination);

					if(index == 0)
						li.css('margin-left', 0).addClass('current');
				});

				this.container.append(this.pagination);
			}

			// Resize
			$(this.imageContainer).css({
				width: this.width+'px',
				height: this.height+'px'
			});

			$(this.image1).css({
				width: this.width+'px',
				height: this.height+'px'
			});

			$(this.image2).css({
				width: this.width+'px',
				height: this.height+'px'
			});

			this.container.css({
				width: this.width+'px',
				height: this.height+(this.options.pagination?this.pagination.height():0)+'px'
			});
			
			// Should we add prev/next controls?
			if(this.options.controls)
			{
				var css = {
					padding: '4px 10px 10px',
					'font-size': '60px',
					'font-family': 'arial, sans-serif',
					'line-height': '1em',
					'font-weight': 'bold',
					color: '#FFF',
					'text-decoration': 'none',
					background: 'rgba(0,0,0,0.5)',
					position: 'absolute',
					'z-index': 2000
				};
				
				this.nextButton = $('<a href="#">≫</a>').css(css).css3({
					'border-radius': '4px'
				}).appendTo(this.surface).bind('click', function(event){
					event.preventDefault();
					_this.next();
				});
				
				this.prevButton = $('<a href="#">≪</a>').css(css).css3({
					'border-radius': '4px'
				}).appendTo(this.surface).bind('click', function(event){
					event.preventDefault();
					_this.prev();
				});
				
				var top = (this.height - this.nextButton.height())/2;
				this.nextButton.css({
					top: top+'px',
					right: '10px'
				});
				
				this.prevButton.css({
					top: top+'px',
					left: '10px'
				});
			}
			
			// Should we use captions?
			if(this.options.captions)
			{
				this.captionBar = $('<div class="caption"></div>').css({
					background: 'rgba(0,0,0,0.6)',
					color: '#FFF',
					'font-size': '16px',
					'font-family': 'helvetica, arial, sans-serif',
					'text-decoration': 'none',
					'font-weight': 'bold',
					padding: '1.5em 1em',
					opacity: 0,
					position: 'absolute',
					'z-index': 110,
					width: '100%',
					bottom: 0
				}).css3({
					'transition-property': 'opacity',
					'transition-duration': '800ms',
					'box-sizing': 'border-box'
				}).prependTo(this.surface);
			}
			
			this.updateCaption();
		},
		setupImages: function() {
			var img1 = this.getImage(this.currentImageIndex),
				css1 = {
					'background-image': 'url("'+img1.src+'")',
					'z-index': 101,
					'cursor': 'auto'
				};

			// Does this image have an associated link?
			if($(img1).data('href'))
			{
				css1.cursor = 'pointer';
				this.image1.addClass('hasLink');
				this.image1.data('href', $(img1).data('href'));
			}
			else
			{
				this.image1.removeClass('hasLink');
				this.image1.data('href', null);
			}

			this.image1.css(css1).children().remove();

			this.image2.css({
				'background-image': 'url("'+this.getImage(this.nextImageIndex).src+'")',
				'z-index': 100
			}).show();

			if(this.options.pagination && this.pagination)
			{
				this.pagination.find('li.current').removeClass('current');
				$(this.pagination.find('li')[this.currentImageIndex]).addClass('current');
			}
		},
		transition: function(transition, opts) {
			// Allow a transition to be picked from ALL available transitions (not just the reduced set)
	        if(transition == undefined || !flux.transitions[transition])
	        {
	            // Pick a transition at random from the (possibly reduced set of) transitions
	            var index = Math.floor(Math.random()*(this.options.transitions.length));
	            transition = this.options.transitions[index];
	        }
			
			var tran = null;

			try {
		        tran = new flux.transitions[transition](this, $.extend(this.options[transition] ? this.options[transition] : {}, opts));
			}
			catch(e) {
				// If an invalid transition has been provided then use the fallback (default is to just switch the image)
				tran = new flux.transition(this, {fallback: true});
			}

	        tran.run();
			
	        this.currentImageIndex = this.nextImageIndex;
	        this.setNextIndex(this.currentImageIndex+1);
			this.updateCaption();
		},
		updateCaption: function() {
			var str = $(this.getImage(this.currentImageIndex)).attr('title');
			if(this.options.captions && this.captionBar)
			{
				if(str !== "")
					this.captionBar.html(str);
					
				this.captionBar.css('opacity', str === "" ? 0 : 1);
			}
		},
		getImage: function(index) {
			index = index % this.images.length;

			return this.images[index];
		},
		setNextIndex: function(nextIndex)
		{
			if(nextIndex == undefined)
				nextIndex = this.currentImageIndex+1;

			this.nextImageIndex = nextIndex;

			if(this.nextImageIndex > this.images.length-1)
				this.nextImageIndex = 0;

			if(this.nextImageIndex < 0)
				this.nextImageIndex = this.images.length-1;
		},
		increment: function() {
			this.currentImageIndex++;
			if(this.currentImageIndex > this.images.length-1)
				this.currentImageIndex = 0;
		}
	};
})(window.jQuery || window.Zepto);

/**
 * Helper object to determine support for various CSS3 functions
 * @author Joe Lambert
 */

(function($) {
	flux.browser = {
		init: function() {
			// Have we already been initialised?
			if(flux.browser.supportsTransitions !== undefined)
				return;

			var div = document.createElement('div'),
				prefixes = ['-webkit', '-moz', '-o', '-ms'],
				domPrefixes = ['Webkit', 'Moz', 'O', 'Ms'];

			// Does the current browser support CSS Transitions?
			if(window.Modernizr && Modernizr.csstransitions !== undefined)
				flux.browser.supportsTransitions = Modernizr.csstransitions;
			else
			{
				flux.browser.supportsTransitions = this.supportsCSSProperty('Transition');
			}

			// Does the current browser support 3D CSS Transforms?
			if(window.Modernizr && Modernizr.csstransforms3d !== undefined)
				flux.browser.supports3d = Modernizr.csstransforms3d;
			else
			{
				// Custom detection when Modernizr isn't available
				flux.browser.supports3d = this.supportsCSSProperty("Perspective");
				
				if ( flux.browser.supports3d && 'webkitPerspective' in $('body').get(0).style ) {
					// Double check with a media query (similar to how Modernizr does this)
					var div3D = $('<div id="csstransform3d"></div>');
					var mq = $('<style media="(transform-3d), ('+prefixes.join('-transform-3d),(')+'-transform-3d)">div#csstransform3d { position: absolute; left: 9px }</style>');

					$('body').append(div3D);
					$('head').append(mq);

					flux.browser.supports3d = div3D.get(0).offsetLeft == 9;

					div3D.remove();
					mq.remove();	
				}
			}

		},
		supportsCSSProperty: function(prop) {
			var div = document.createElement('div'),
				prefixes = ['-webkit', '-moz', '-o', '-ms'],
				domPrefixes = ['Webkit', 'Moz', 'O', 'Ms'];
				
			var support = false;
			for(var i=0; i<domPrefixes.length; i++)
			{
				if(domPrefixes[i]+prop in div.style)
					support = support || true;
			}
			
			return support;
		},
		translate: function(x, y, z) {
			x = (x != undefined) ? x : 0;
			y = (y != undefined) ? y : 0;
			z = (z != undefined) ? z : 0;

			return 'translate' + (flux.browser.supports3d ? '3d(' : '(') + x + 'px,' + y + (flux.browser.supports3d ? 'px,' + z + 'px)' : 'px)');
		},

		rotateX: function(deg) {
			return flux.browser.rotate('x', deg);
		},

		rotateY: function(deg) {
			return flux.browser.rotate('y', deg);
		},

		rotateZ: function(deg) {
			return flux.browser.rotate('z', deg);
		},

		rotate: function(axis, deg) {
			if(!axis in {'x':'', 'y':'', 'z':''})
				axis = 'z';

			deg = (deg != undefined) ? deg : 0;

			if(flux.browser.supports3d)
				return 'rotate3d('+(axis == 'x' ? '1' : '0')+', '+(axis == 'y' ? '1' : '0')+', '+(axis == 'z' ? '1' : '0')+', '+deg+'deg)';
			else
			{
				if(axis == 'z')
					return 'rotate('+deg+'deg)';
				else
					return '';
			}
		}
	};

	$(function(){
		// To continue to work with legacy code, ensure that flux.browser is initialised on document ready at the latest
		flux.browser.init();
	});
})(window.jQuery || window.Zepto);

(function($){
	/**
	 * Helper function for cross-browser CSS3 support, prepends all possible prefixes to all properties passed in
	 * @param {Object} props Ker/value pairs of CSS3 properties
	 */
	$.fn.css3 = function(props) {
		var css = {};
		var prefixes = ['webkit', 'moz', 'ms', 'o'];

		for(var prop in props)
		{
			// Add the vendor specific versions
			for(var i=0; i<prefixes.length; i++)
				css['-'+prefixes[i]+'-'+prop] = props[prop];
			
			// Add the actual version	
			css[prop] = props[prop];
		}
		
		this.css(css);
		return this;
	};
	
	/**
	 * Helper function to bind to the correct transition end event
	 * @param {function} callback The function to call when the event fires
	 */
	$.fn.transitionEnd = function(callback) {
		var _this = this;
		var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd'];

		for(var i=0; i < events.length; i++)
		{
			this.bind(events[i], function(event){
				// Automatically stop listening for the event
				for(var j=0; j<events.length;j++)
					$(this).unbind(events[j]);

				// Perform the callback function
				if(callback)
					callback.call(this, event);
			});
		}
		
		return this;
	};

	flux.transition = function(fluxslider, opts) {
		this.options = $.extend({
			requires3d: false,
			after: function() {
				// Default callback for after the transition has completed
			}
		}, opts);

		this.slider = fluxslider;

		// We need to ensure transitions degrade gracefully if the transition is unsupported or not loaded
		if((this.options.requires3d && !flux.browser.supports3d) || !flux.browser.supportsTransitions || this.options.fallback === true)
		{
			var _this = this;
			
			this.options.after = undefined;

			this.options.setup = function() {
				//console.error("Fallback setup()");
				_this.fallbackSetup();
			};
			
			this.options.execute = function() {
				//console.error("Fallback execute()");
				_this.fallbackExecute();
			};
		}
	};

	flux.transition.prototype = {
		constructor: flux.transition,
		hasFinished: false, // This is a lock to ensure that the fluxTransitionEnd event is only fired once per tansition
		run: function() {
			var _this = this;

			// do something
			if(this.options.setup !== undefined)
				this.options.setup.call(this);
			
			// Remove the background image from the top image
			this.slider.image1.css({
				'background-image': 'none'
			});

			this.slider.imageContainer.css('overflow', this.options.requires3d ? 'visible' : 'hidden');

			// For some of the 3D effects using Zepto we need to delay the transitions for some reason
			setTimeout(function(){
				if(_this.options.execute !== undefined)
					_this.options.execute.call(_this);
			}, 5);
		},
		finished: function() {
			if(this.hasFinished)
				return;
				
			this.hasFinished = true;
			
			if(this.options.after)
				this.options.after.call(this);

			this.slider.imageContainer.css('overflow', 'hidden');	

			this.slider.setupImages();

			// Trigger an event to signal the end of a transition
			this.slider.element.trigger('fluxTransitionEnd', {
				currentImage: this.slider.getImage(this.slider.currentImageIndex)
			});
		},
		fallbackSetup: function() {
			
		},
		fallbackExecute: function() {
			this.finished();
		}
	};

	flux.transitions = {};
	
	// Flux grid transition
	
	flux.transition_grid = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			columns: 6,
			rows: 6,
			forceSquare: false,
			setup: function() {
				var imgWidth = this.slider.image1.width(),
					imgHeight = this.slider.image1.height();
					
				var colWidth = Math.ceil(imgWidth / this.options.columns),
					rowHeight = Math.ceil(imgHeight / this.options.rows);
					
				if(this.options.forceSquare)
				{
					rowHeight = colWidth;
					this.options.rows = Math.floor(imgHeight / rowHeight);
				}

				// Work out how much space remains with the adjusted barWidth
				var colRemainder = imgWidth - (this.options.columns * colWidth),
					colAddPerLoop = Math.ceil(colRemainder / this.options.columns),
					
					rowRemainder = imgHeight - (this.options.rows * rowHeight),
					rowAddPerLoop = Math.ceil(rowRemainder / this.options.rows),
					
					delayBetweenBars = 150,
					height = this.slider.image1.height(),
					totalLeft = 0,
					totalTop = 0,
					fragment = document.createDocumentFragment();
				
				for(var i=0; i<this.options.columns; i++) {
					var thisColWidth = colWidth,
						totalTop = 0;

					if(colRemainder > 0)
					{
						var add = colRemainder >= colAddPerLoop ? colAddPerLoop : colRemainder;
						thisColWidth += add;
						colRemainder -= add;
					}
					
					for(var j=0; j<this.options.rows; j++)
					{
						var thisRowHeight = rowHeight,
							thisRowRemainder = rowRemainder;

						if(thisRowRemainder > 0)
						{
							var add = thisRowRemainder >= rowAddPerLoop ? rowAddPerLoop : thisRowRemainder;
							thisRowHeight += add;
							thisRowRemainder -= add;
						}
						
						var tile = $('<div class="tile tile-'+i+'-'+j+'"></div>').css({
							width: thisColWidth+'px',
							height: thisRowHeight+'px',
							position: 'absolute',
							top: totalTop+'px',
							left: totalLeft+'px'
						});
						
						this.options.renderTile.call(this, tile, i, j, thisColWidth, thisRowHeight, totalLeft, totalTop);
						
						fragment.appendChild(tile.get(0));
						
						totalTop += thisRowHeight;
					}
					
					totalLeft += thisColWidth;
				}

				// Append the fragement to the surface
				this.slider.image1.get(0).appendChild(fragment);
			},
			execute: function() {
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.barcontainer');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				bars.last().transitionEnd(function(event){
					_this.slider.image2.show();

					_this.finished();
				});

				bars.css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, height/2, height/2)
				});
			},
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				
			}
		}, opts));	
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.bars = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			columns: 10,
			rows: 1,
			delayBetweenBars: 40,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				$(elem).css({
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px 0px'
				}).css3({
					'transition-duration': '400ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBars)+'ms'
				});
			},
			execute: function() {
				var _this = this;
	
				var height = this.slider.image1.height();
	
				var bars = this.slider.image1.find('div.tile');
	
				// Get notified when the last transition has completed
				$(bars[bars.length-1]).transitionEnd(function(){
					_this.finished();
				});
				
				setTimeout(function(){
					bars.css({
						'opacity': '0.5'
					}).css3({
						'transform': flux.browser.translate(0, height)
					});
				}, 50);
				
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.bars3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: column,
			rows: 1,
			delayBetweenBars: 100,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				colWidth=Math.ceil(colWidth);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: (colWidth+2)+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px 0px',
					'background-size':width+"px "+rowHeight+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -rowHeight/2, rowHeight/2)
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, rowHeight/2, rowHeight/2)
				}),
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: rowHeight+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#333',
					'z-index': 190
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, -rowHeight/2) + ' ' + flux.browser.rotateY(180),
					'backface-visibility': 'hidden'
				}),

				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, colWidth-rowHeight/2)
				});
				
				$(elem).css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: leftOffset+'px',
					'z-index': colIndex > this.options.columns/2 ? 1000-colIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '800ms',
					'transition-timing-function': 'ease-out',
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(bar3).append(left).append(right);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				bars.last().transitionEnd(function(event){
					_this.slider.image1.css3({
						'transform-style': 'flat'
					});
					
					_this.slider.image2.show();

					_this.finished();
				});
				var angle=(index==0)?1:-1;
				setTimeout(function(){
					bars.css3({
						'transform': flux.browser.rotateX(-90*angle) + ' ' + flux.browser.translate(0, height*angle/2, height/2)
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.hbars3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: 1,
			rows: column,
			delayBetweenBars: 100,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				rowHeight=Math.ceil(rowHeight);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: '100%',
					height: (rowHeight+1)+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '0px -'+topOffset+'px',
					'background-size':width+"px "+height+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, -width/2)+ ' ' + flux.browser.rotateY(180),
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, width/2)
				}),
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: width+'px',
					height: width+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#333',
					'z-index': 0
				}).css3({
					'transform': flux.browser.rotateX(90) + ' '  + flux.browser.translate(0, -width/2, width/2),
				}),
				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, width/2, -(width/2-rowHeight)),
					'backface-visibility': 'hidden'
				});
				$(elem).css({
					width: '100%',
					height: rowHeight+'px',
					position: 'absolute',
					top: topOffset+'px',
					left: '0px',
					'z-index': rowIndex > this.options.columns/2 ? 1000-rowIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '800ms',
					'transition-timing-function': 'ease-out',
					'transition-property': 'all',
					'transition-delay': (rowIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(bar3).append(left).append(right);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				bars.last().transitionEnd(function(event){
					_this.slider.image1.css3({
						'transform-style': 'flat'
					});
					
					_this.slider.image2.show();

					_this.finished();
				});
				var angle=(index==0)?1:-1;
				setTimeout(function(){
					bars.css3({
						'transform': flux.browser.rotateY(-90*angle) + ' ' + flux.browser.translate(-width*angle/2, 0, width/2)
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
var t_flag=0;
var easing=["easeInQuad","easeOutQuad"];
(function($) {
	flux.transitions.hbarscale3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: 1,
			rows: column,
			delayBetweenBars: delay,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				rowHeight=Math.ceil(rowHeight);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: '100%',
					height: (rowHeight+1)+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '0px -'+topOffset+'px',
					'background-size':width+"px "+height+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, -width/2)+ ' ' + flux.browser.rotateY(180),
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, width/2)
				}),
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: width+'px',
					height: width+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#333',
					'z-index': 0
				}).css3({
					'transform': flux.browser.rotateX(90) + ' '  + flux.browser.translate(0, -width/2, width/2),
				}),
				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, width/2, -(width/2-rowHeight)),
					'backface-visibility': 'hidden'
				});
				$(elem).css({
					width: '100%',
					height: rowHeight+'px',
					position: 'absolute',
					top: topOffset+'px',
					left: '0px',
					'z-index': rowIndex > this.options.columns/2 ? 1000-rowIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '600ms',
					'transition-timing-function': 'ease-out',
					'transition-property': 'all',
					'transition-delay': (rowIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(bar3).append(left).append(right);
				var temp=0;				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();
				var angle=(index==0)?1:-1;
				// Get notified when the last transition has completed
				setTimeout(function(event){
						setTimeout(function(){
							t_flag=1;
							bars.css3({
								'transform': flux.browser.rotateY(-angle*90) + ' ' + flux.browser.translate(-width*angle/2, 0, width/2) + ' ' + 'scale3d(1,1,1)'});
								setTimeout(function()
								{
									_this.slider.image1.css3({
										'transform-style': 'flat'
									});							
									_this.slider.image2.show();	
									_this.finished();
									t_flag=0;
								},800+(column+1)*delay);
						}, 50);
				},600);

				setTimeout(function(){
					bars.css3({
						'transform': flux.browser.rotateY(-angle*45) + ' ' + flux.browser.translate(-width*angle/2, 0, width/2) + ' ' + 'scale3d(0.6,0.5,1)'
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.barscale3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: column,
			rows: 1,
			delayBetweenBars: delay,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				colWidth=Math.ceil(colWidth);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px 0px',
					'background-size':width+"px "+rowHeight+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -rowHeight/2, rowHeight/2)
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, rowHeight/2, rowHeight/2)
				}),				
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: rowHeight+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#333',
					'z-index': 190
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, -rowHeight/2) + ' ' + flux.browser.rotateY(180),
					'backface-visibility': 'hidden'
				}),

				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, colWidth-rowHeight/2)
				});
				
				$(elem).css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: leftOffset+'px',
					'z-index': colIndex > this.options.columns/2 ? 1000-colIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '600ms',
					'transition-timing-function': easing[t_flag],
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(bar3).append(left).append(right);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();
				var angle=(index==0)?1:-1;
				// Get notified when the last transition has completed
				setTimeout(function(event){
						setTimeout(function(){
							t_flag=1;
							bars.css3({
								'transform': flux.browser.rotateX(-angle*90) + ' ' + flux.browser.translate(0, angle*height/2, height/2) + ' ' + 'scale3d(1,1,1)'});
								setTimeout(function()
								{
									_this.slider.image1.css3({
										'transform-style': 'flat'
									});							
									_this.slider.image2.show();	
									_this.finished();
									t_flag=0;
								},600+(column-1)*delay);
						}, 50);
				},600);

				setTimeout(function(){
					bars.css3({
						'transform': flux.browser.rotateX(-angle*45) + ' ' + flux.browser.translate(0, angle*height/2, height/2) + ' ' + 'scale3d(0.6,0.5,1)'
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.hbardance3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: 1,
			rows: column,
			delayBetweenBars: delay,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				rowHeight=Math.ceil(rowHeight);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: '100%',
					height: (rowHeight+1)+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '0px -'+topOffset+'px',
					'background-size':width+"px "+height+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, -width/2)+ ' ' + flux.browser.rotateY(180),
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, width/2)
				}),
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: width+'px',
					height: width+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#333',
					'z-index': 0
				}).css3({
					'transform': flux.browser.rotateX(90) + ' '  + flux.browser.translate(0, -width/2, width/2),
				}),
				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, width/2, -(width/2-rowHeight)),
					'backface-visibility': 'hidden'
				});
				$(elem).css({
					width: '100%',
					height: rowHeight+'px',
					position: 'absolute',
					top: topOffset+'px',
					left: '0px',
					'z-index': rowIndex > this.options.columns/2 ? 1000-rowIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '600ms',
					'transition-timing-function': 'ease-out',
					'transition-property': 'all',
					'transition-delay': (rowIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(bar3).append(left).append(right);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();
				var angle=(index==0)?1:-1;
				// Get notified when the last transition has completed
				setTimeout(function(event){
						setTimeout(function(){
							t_flag=1;
							bars.css3({
								'transform': flux.browser.rotateY(-angle*90) + ' ' + flux.browser.translate(-width*angle/2, 0, width/2) + ' ' + 'scale3d(1,1,1)'});
								setTimeout(function()
								{
									_this.slider.image1.css3({
										'transform-style': 'flat'
									});							
									_this.slider.image2.show();	
									_this.finished();
									t_flag=0;
								},600+(column-1)*delay);
						}, 50);
				},600);

				setTimeout(function(){
					bars.css3({
						'transform': flux.browser.rotateY(angle*45) + ' ' + flux.browser.translate(-width*angle/4, 0, width/4) + ' ' + 'scale3d(0.65,0.65,1)'
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.bardance3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: column,
			rows: 1,
			delayBetweenBars: delay,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				colWidth=Math.ceil(colWidth);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px 0px',
					'background-size':width+"px "+rowHeight+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -rowHeight/2, rowHeight/2)
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, rowHeight/2, rowHeight/2)
				}),
				bottom = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, rowHeight/2, rowHeight/2)
				}),
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: rowHeight+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#333',
					'z-index': 190
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, -rowHeight/2) + ' ' + flux.browser.rotateY(180),
					'backface-visibility': 'hidden'
				}),

				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, colWidth-rowHeight/2)
				});
				
				$(elem).css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: leftOffset+'px',
					'z-index': colIndex > this.options.columns/2 ? 1000-colIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '600ms',
					'transition-timing-function': easing[t_flag],
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(left).append(right).append(bottom);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();
				var angle=(index==0)?1:-1;
				// Get notified when the last transition has completed
				setTimeout(function(event){
						setTimeout(function(){
							t_flag=1;
							bars.css3({
								'transform': flux.browser.rotateX(-90*angle) + ' ' + flux.browser.translate(0, height*angle/2, height/2) + ' ' + 'scale3d(1,1,1)'});
								setTimeout(function()
								{
									_this.slider.image1.css3({
										'transform-style': 'flat'
									});							
									_this.slider.image2.show();	
									_this.finished();
									t_flag=0;
								},600+(column-1)*delay);
						}, 50);
				},600);

				setTimeout(function(){
					bars.css3({
						'transform': flux.browser.rotateX(45*angle) + ' ' + flux.browser.translate(0, height*angle/2, height/2) + ' ' + 'scale3d(0.6,0.5,1)'
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.barrotate = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: column,
			rows: 1,
			delayBetweenBars: 100,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				colWidth=Math.ceil(colWidth);
				var bar = $('<div class="bar-'+colIndex+'"></div>').css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px 0px',
					'background-size':width+"px "+rowHeight+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image1.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(180) + ' ' + flux.browser.translate(0, 0, rowHeight)
				}),
				bottom = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image1.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, rowHeight/2, rowHeight/2)
				}),
				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: rowHeight+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'background-image': this.slider.image1.css('background-image'),
					'z-index': 190
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, -rowHeight/2) + ' ' + flux.browser.rotateY(180),
					'backface-visibility': 'hidden'
				}),

				right = $(left.get(0).cloneNode(false)).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, colWidth-rowHeight/2)
				});
				$(elem).css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: '0px',
					left: leftOffset+'px',
					'z-index': colIndex > this.options.columns/2 ? 1000-colIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '1000ms',
					'transition-timing-function': 'cubic-bezier(0.42,0,0.58,1)',
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(left).append(right).append(bottom);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				bars.last().transitionEnd(function(event){
					_this.slider.image1.css3({
						'transform-style': 'flat'
					});
					
					_this.slider.image2.show();

					_this.finished();
				});
				var path=["rotate3d(10,10,10,180deg)","rotate3d(-50,-50,-50,170deg)"];
				setTimeout(function(){
					bars.css3({
						'transform': path[index] + ' ' + flux.browser.translate(0, 0, 0)
						,
						'opacity':0
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.hbar3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			columns: 1,
			rows: row,
			delayBetweenBars: 100,
			perspective: 1000,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				colWidth=Math.ceil(colWidth);
				var bar = $('<div class="bar-'+rowIndex+'"></div>').css({
					width: '100%',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					'z-index': 200,
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '0px -'+topOffset+'px',
					'background-size':width+"px "+height+"px",
					'background-repeat': 'no-repeat'
				}).css3({
					'backface-visibility': 'hidden'
				}),
				
				bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -rowHeight/2, rowHeight/2)
				}),
				bar3 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
				}).css3({
					'transform': flux.browser.rotateY(180)+' '+flux.browser.translate(0, 0, 30)
				});

				left = $('<div class="side bar-'+colIndex+'"></div>').css({
					width: rowHeight+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: '#555',
					'z-index': 190
				}).css3({
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(rowHeight/2, 0, -rowHeight/2) + ' ' + flux.browser.rotateY(180),
					'backface-visibility': 'hidden'
				}),

				right = $(left.get(0).cloneNode(false)).css3({
					'width':'30px',
					'transform': flux.browser.rotateY(90) + ' ' + flux.browser.translate(15, 0, colWidth-15)
				});
				if(index==1)
				{
					bar2 = $(bar.get(0).cloneNode(false)).css({
					'background-image': this.slider.image1.css('background-image')
					}).css3({
						'transform': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -rowHeight/2, rowHeight/2)
					})
				}
				$(elem).css({
					width: colWidth+'px',
					height: '100%',
					position: 'absolute',
					top: topOffset+'px',
					left: '0px',
					'z-index': colIndex > this.options.columns/2 ? 1000-colIndex : 1000 // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '1000ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBars)+'ms',
					'transform-style': 'preserve-3d'
				}).append(bar).append(bar2).append(bar3).append(left).append(right);
				var temp=0;
				
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).css({
					'-moz-transform': 'perspective('+this.options.perspective+'px)',
					'-moz-perspective': 'none',
					'-moz-transform-style': 'preserve-3d'
				});
				
				var _this = this,
					height = this.slider.image1.height(),
					bars = this.slider.image1.find('div.tile');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				bars.last().transitionEnd(function(event){
					_this.slider.image1.css3({
						'transform-style': 'flat'
					});
					
					_this.slider.image2.show();

					_this.finished();
				});
				
				setTimeout(function(){
					if(index==0)
					{
						bars.css3({
							'transform': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, height/2, 0)
						});
					}
					else
					{
						bars.css3({
							'opacity':0,
							'transform': flux.browser.rotateY(-179) + ' ' + flux.browser.translate(0, -0, 0)
						});
					}
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {	
	flux.transitions.blinds = function(fluxslider, opts) {
		return new flux.transitions.bars(fluxslider, $.extend({
			execute: function() {
				var _this = this;

				var height = this.slider.image1.height();

				var bars = this.slider.image1.find('div.tile');

				// Get notified when the last transition has completed
				$(bars[bars.length-1]).transitionEnd(function(){
					_this.finished();
				});
				
				setTimeout(function(){
					bars.css({
						'opacity': '0.5'
					}).css3({
						'transform': 'scalex(0.0001)'
					});
				}, 50);
			}
		}, opts));
	}
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.blinds3d = function(fluxslider, opts) {
		return new flux.transitions.tiles3dreverse(fluxslider, $.extend({
			forceSquare: false,
			rows: row,
			columns: column
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.blinds3dturn = function(fluxslider, opts) {
		return new flux.transitions.tiles3d(fluxslider, $.extend({
			forceSquare: false,
			rows: row,
			columns: column
		}, opts));
	};
})(window.jQuery || window.Zepto);
(function($) {
	flux.transitions.zip = function(fluxslider, opts) {
		return new flux.transitions.bars(fluxslider, $.extend({
			execute: function() {
				var _this = this;

				var height = this.slider.image1.height();

				var bars = this.slider.image1.find('div.tile');

				// Get notified when the last transition has completed
				$(bars[bars.length-1]).transitionEnd(function(){
					_this.finished();
				});
				
				setTimeout(function(){
					bars.each(function(index, bar){						
						$(bar).css({
							'opacity': '0.3'
						}).css3({
							'transform': flux.browser.translate(0, (index%2 ? '-'+(2*height) : height))
						});		
					});
				}, 20);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.blocks = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			forceSquare: true,
			delayBetweenBars: 100,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				var delay = Math.floor(Math.random()*10*this.options.delayBetweenBars);
				
				$(elem).css({
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px -'+topOffset+'px'
				}).css3({
					'transition-duration': '350ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'all',
					'transition-delay': delay+'ms'
				});
				
				// Keep track of the last elem to fire
				if(this.maxDelay === undefined)
					this.maxDelay = 0;
					
				if(delay > this.maxDelay)
				{
					this.maxDelay = delay;
					this.maxDelayTile = elem;
				}
			},
			execute: function() {
				var _this = this;
	
				var blocks = this.slider.image1.find('div.tile');
	
				// Get notified when the last transition has completed
				this.maxDelayTile.transitionEnd(function(){
					_this.finished();
				});
	
				setTimeout(function(){
					blocks.each(function(index, block){				
						$(block).css({
							'opacity': '0'
						}).css3({
							'transform': 'scale(0.8)'
						});
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.blocks2 = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			cols: 12,
			forceSquare: true,
			delayBetweenDiagnols: 150,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				var delay = Math.floor(Math.random()*10*this.options.delayBetweenBars);
				
				$(elem).css({
					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px -'+topOffset+'px'
				}).css3({
					'transition-duration': '350ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'all',
					'transition-delay': (colIndex+rowIndex)*this.options.delayBetweenDiagnols+'ms',
					'backface-visibility': 'hidden' // trigger hardware acceleration
				});
			},
			execute: function() {
				var _this = this;
	
				var blocks = this.slider.image1.find('div.tile');
	
				// Get notified when the last transition has completed
				blocks.last().transitionEnd(function(){
					_this.finished();
				});
				
				setTimeout(function(){
					blocks.each(function(index, block){				
						$(block).css({
							'opacity': '0'
						}).css3({
							'transform': 'scale(0.8)'
						});
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.concentric = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			blockSize: 60,
			delay: 150,
			alternate: false,
			setup: function() {
				var w = this.slider.image1.width(),
					h = this.slider.image1.height(),
					largestLength = Math.sqrt(w*w + h*h), // Largest length is the diagonal

					// How many blocks do we need?
					blockCount = Math.ceil(((largestLength-this.options.blockSize)/2) / this.options.blockSize) + 1, // 1 extra to account for the round border
					fragment = document.createDocumentFragment();

				for(var i=0; i<blockCount; i++)
				{
					var thisBlockSize = (2*i*this.options.blockSize)+this.options.blockSize;

					var block = $('<div></div>').attr('class', 'block block-'+i).css({
						width: thisBlockSize+'px',
						height: thisBlockSize+'px',
						position: 'absolute',
						top: ((h-thisBlockSize)/2)+'px',
						left: ((w-thisBlockSize)/2)+'px',

						'z-index': 100+(blockCount-i),

						'background-image': this.slider.image1.css('background-image'),
						'background-position': 'center center'
					}).css3({
						'border-radius': thisBlockSize+'px',
						'transition-duration': '800ms',
						'transition-timing-function': 'linear',
						'transition-property': 'all',
						'transition-delay': ((blockCount-i)*this.options.delay)+'ms'
					});

					fragment.appendChild(block.get(0));
				}

				//this.slider.image1.append($(fragment));
				this.slider.image1.get(0).appendChild(fragment);
			},
			execute: function() {
				var _this = this;

				var blocks = this.slider.image1.find('div.block');

				// Get notified when the last transition has completed
				$(blocks[0]).transitionEnd(function(){
					_this.finished();
				});

				setTimeout(function(){
					blocks.each(function(index, block){
						$(block).css({
							'opacity': '0'
						}).css3({
							'transform': flux.browser.rotateZ((!_this.options.alternate || index%2 ? '' : '-')+'90')
						});
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.warp = function(fluxslider, opts) {
		return new flux.transitions.concentric(fluxslider, $.extend({
			delay: 30,
			alternate: true
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.cube = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			requires3d: true,
			barWidth: 100,
			direction: 'left',
			perspective: 1000,
			setup: function() {
				var width = this.slider.image1.width();
				var height = this.slider.image1.height();

				// Setup the container to allow 3D perspective

				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				});

				this.cubeContainer = $('<div class="cube"></div>').css({
					width: width+'px',
					height: height+'px',
					position: 'relative'
				}).css3({
					'transition-duration': '800ms',
					'transition-timing-function': 'linear',
					'transition-property': 'all',
					'transform-style': 'preserve-3d'
				});

				var css = {
					height: '100%',
					width: '100%',
					position: 'absolute',
					top: '0px',
					left: '0px'
				};

				var currentFace = $('<div class="face current"></div>').css($.extend(css, {
					background: this.slider.image1.css('background-image')
				})).css3({
					'backface-visibility': 'hidden'
				});

				this.cubeContainer.append(currentFace);

				var nextFace = $('<div class="face next"></div>').css($.extend(css, {
					background: this.slider.image2.css('background-image')
				})).css3({
					'transform' : this.options.transitionStrings.call(this, this.options.direction, 'nextFace'),
					'backface-visibility': 'hidden'
				});

				this.cubeContainer.append(nextFace);

				this.slider.image1.append(this.cubeContainer);
			},
			execute: function() {
				var _this = this;

				var width = this.slider.image1.width();
				var height = this.slider.image1.height();

				this.slider.image2.hide();
				this.cubeContainer.transitionEnd(function(){
					_this.slider.image2.show();

					_this.finished();
				});
				
				setTimeout(function(){
					_this.cubeContainer.css3({
						'transform' : _this.options.transitionStrings.call(_this, _this.options.direction, 'container')
					});
				}, 50);
			},
			transitionStrings: function(direction, elem) {
				var width = this.slider.image1.width();
				var height = this.slider.image1.height();

				// Define the various transforms that are required to perform various cube rotations
				var t = {
					'up' : {
						'nextFace': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, height/2, height/2),
						'container': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -height/2, height/2)
					},
					'down' : {
						'nextFace': flux.browser.rotateX(90) + ' ' + flux.browser.translate(0, -height/2, height/2),
						'container': flux.browser.rotateX(-90) + ' ' + flux.browser.translate(0, height/2, height/2)
					},
					'left' : {
						'nextFace': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, width/2),
						'container': flux.browser.rotateY(-90) + ' ' + flux.browser.translate(-width/2, 0, width/2)
					},
					'right' : {
						'nextFace': flux.browser.rotateY(-90) + ' ' + flux.browser.translate(-width/2, 0, width/2),
						'container': flux.browser.rotateY(90) + ' ' + flux.browser.translate(width/2, 0, width/2)
					}
				};

				return (t[direction] && t[direction][elem]) ? t[direction][elem] : false;
			}
		}, opts));	
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.tiles3d = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			forceSquare: true,
			columns: column,
			perspective: 600,
			delayBetweenBarsX: delay,
			delayBetweenBarsY: delay,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				var tile = $('<div></div>').css({
					width: colWidth+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					//'z-index': 200, // Removed to make compatible with FF10 (Chrome bug seems to have been fixed)

					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px -'+topOffset+'px',
					'background-size':width+'px '+height+'px',
					'background-repeat': 'no-repeat',
					'-moz-transform': 'translateZ(1px)'
				}).css3({
					'backface-visibility': 'hidden'
				});

				var tile2 = $(tile.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
					//'z-index': 190 // Removed to make compatible with FF10 (Chrome bug seems to have been fixed)
				});
				if(index==0)
					tile2.css3({
						'transform': flux.browser.rotateY(180),
						'backface-visibility': 'hidden'
					});
				else
					tile2.css3({
					'transform': flux.browser.rotateX(-180),
					'backface-visibility': 'hidden'
				});

				$(elem).css({
					'z-index': (colIndex > this.options.columns/2 ? 500-colIndex : 500) + (rowIndex > this.options.rows/2 ? 500-rowIndex : 500) // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '800ms',
					'transition-timing-function': 'ease-out',
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBarsX+rowIndex*this.options.delayBetweenBarsY)+'ms',
					'transform-style': 'preserve-3d'
				}).append(tile).append(tile2);
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				});
				
				var _this = this;

				var tiles = this.slider.image1.find('div.tile');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				tiles.last().transitionEnd(function(event){
					_this.slider.image2.show();

					_this.finished();
				});
				setTimeout(function(){
					if(index==0)
						tiles.css3({
							'transform': flux.browser.rotateY(180)
						});
					else
						tiles.css3({
							'transform': flux.browser.rotateX(180)
						});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.tiles3dreverse = function(fluxslider, opts) {
		return new flux.transition_grid(fluxslider, $.extend({
			requires3d: true,
			forceSquare: true,
			columns: column,
			perspective: 600,
			delayBetweenBarsX: delay,
			delayBetweenBarsY: delay,
			renderTile: function(elem, colIndex, rowIndex, colWidth, rowHeight, leftOffset, topOffset) {
				var tile = $('<div></div>').css({
					width: colWidth+'px',
					height: rowHeight+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					//'z-index': 200, // Removed to make compatible with FF10 (Chrome bug seems to have been fixed)

					'background-image': this.slider.image1.css('background-image'),
					'background-position': '-'+leftOffset+'px -'+topOffset+'px',
					'background-size':width+'px '+height+'px',
					'background-repeat': 'no-repeat',
					'-moz-transform': 'translateZ(1px)'
				}).css3({
					'backface-visibility': 'hidden'
				});

				var tile2 = $(tile.get(0).cloneNode(false)).css({
					'background-image': this.slider.image2.css('background-image')
					//'z-index': 190 // Removed to make compatible with FF10 (Chrome bug seems to have been fixed)
				}).css3({
					'transform': flux.browser.rotateY(0),
					'backface-visibility': 'hidden'
				});

				$(elem).css({
					'z-index': (colIndex > this.options.columns/2 ? 500-colIndex : 500) + (rowIndex > this.options.rows/2 ? 500-rowIndex : 500) // Fix for Chrome to ensure that the z-index layering is correct!
				}).css3({
					'transition-duration': '500ms',
					'transition-timing-function': 'ease-out',
					'transition-property': 'all',
					'transition-delay': (colIndex*this.options.delayBetweenBarsX+rowIndex*this.options.delayBetweenBarsY)+'ms',
					'transform-style': 'preserve-3d'
				}).append(tile).append(tile2);
			},
			execute: function() {
				this.slider.image1.css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				});
				
				var _this = this;

				var tiles = this.slider.image1.find('div.tile');

				this.slider.image2.hide();

				// Get notified when the last transition has completed
				tiles.last().transitionEnd(function(event){
					_this.slider.image2.show();

					_this.finished();
				});
				
				setTimeout(function(){
					if(index==0)
					{
						tiles.css3({
							'transform': flux.browser.rotateY(-90)
						});
					}						
					else
					{
						tiles.css3({
							'transform': flux.browser.rotateX(-90)
						});
					}
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.turn = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			requires3d: true,
			perspective: 1300,
			direction: 'left',
			setup: function() {				
				var tab = $('<div class="tab"></div>').css({
						width: '50%',
						height: '100%',
						position: 'absolute',
						top: '0px',
						left: this.options.direction == 'left' ? '50%' : '0%',
						'z-index':101
					}).css3({
						'transform-style': 'preserve-3d',
						'transition-duration': '1000ms',
						'transition-timing-function': 'ease-out',
						'transition-property': 'all',
						'transform-origin': this.options.direction == 'left' ? 'left center' : 'right center'
					}),
				front = $('<div></div>').appendTo(tab).css({
						'background-image': this.slider.image1.css('background-image'),
						'background-position': (this.options.direction == 'left' ? '-'+(this.slider.image1.width()/2) : 0)+'px 0',
						'background-size':width+'px '+height+'px',
						width: '100%',
						height: '100%',
						position: 'absolute',
						top: '0',
						left: '0',
						'-moz-transform': 'translateZ(1px)'
					}).css3({
						'backface-visibility': 'hidden'
					}),

				back = $('<div></div>').appendTo(tab).css({
						'background-image': this.slider.image2.css('background-image'),
						'background-position': (this.options.direction == 'left' ? 0 : '-'+(this.slider.image1.width()/2))+'px 0',
						'background-size':width+'px '+height+'px',
						width: '100%',
						height: '100%',
						position: 'absolute',
						top: '0',
						left: '0'
					}).css3({
						transform: flux.browser.rotateY(180),
						'backface-visibility': 'hidden'
					}),

				current = $('<div></div>').css({
					position: 'absolute',
					top: '0',
					left: this.options.direction == 'left' ? '0' : '50%',
					width: '50%',
					height: '100%',
					'background-image': this.slider.image1.css('background-image'),
					'background-position': (this.options.direction == 'left' ? 0 : '-'+(this.slider.image1.width()/2))+'px 0',
					'background-size':width+'px '+height+'px',
					'z-index':100
				}),

				overlay = $('<div class="overlay"></div>').css({
					position: 'absolute',
					top: '0',
					left: this.options.direction == 'left' ? '50%' : '0',
					width: '50%',
					height: '100%',
					background: '#000',
					opacity: 1
				}).css3({
					'transition-duration': '800ms',
					'transition-timing-function': 'linear',
					'transition-property': 'opacity'
				}),

				container = $('<div></div>').css3({
					width: '100%',
					height: '100%'
				}).css3({
					'perspective': this.options.perspective,
					'perspective-origin': '50% 50%'
				}).append(tab).append(current).append(overlay);

				this.slider.image1.append(container);
			},
			execute: function() {
				var _this = this;

				this.slider.image1.find('div.tab').first().transitionEnd(function(){
					_this.finished();
				});
				
				setTimeout(function(){
					_this.slider.image1.find('div.tab').css3({
						// 179 not 180 so that the tab rotates the correct way in Firefox
						transform: flux.browser.rotateY(_this.options.direction == 'left' ? -179 : 179)
					});
					_this.slider.image1.find('div.overlay').css({
						opacity: 0
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.slide = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			direction: 'left',
			setup: function() {
				var width = this.slider.image1.width(),
					height = this.slider.image1.height(),

				currentImage = $('<div class="current"></div>').css({
					height: height+'px',
					width: width+'px',
					position: 'absolute',
					top: '0px',
					left: '0px',
					background: this.slider[this.options.direction == 'left' ? 'image1' : 'image2'].css('background-image')	
				}).css3({
					'backface-visibility': 'hidden'
				}),

				nextImage = $('<div class="next"></div>').css({
					height: height+'px',
					width: width+'px',
					position: 'absolute',
					top: '0px',
					left: width+'px',
					background: this.slider[this.options.direction == 'left' ? 'image2' : 'image1'].css('background-image')
				}).css3({
					'backface-visibility': 'hidden'
				});

				this.slideContainer = $('<div class="slide"></div>').css({
					width: (2*width)+'px',
					height: height+'px',
					position: 'relative',
					left: this.options.direction == 'left' ? '0px' : -width+'px',
					'z-index': 101
				}).css3({
					'transition-duration': '600ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'all'
				});

				this.slideContainer.append(currentImage).append(nextImage);

				this.slider.image1.append(this.slideContainer);
			},
			execute: function() {
				var _this = this,
					delta = this.slider.image1.width();

				if(this.options.direction == 'left')
					delta = -delta;

				this.slideContainer.transitionEnd(function(){
					_this.finished();
				});
				
				setTimeout(function(){
					_this.slideContainer.css3({
						'transform' : flux.browser.translate(delta)
					});
				}, 50);
			}
		}, opts));	
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.swipe = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			setup: function() {
				var img = $('<div></div>').css({
					width: '100%',
					height: '100%',
					'background-image': this.slider.image1.css('background-image')
				}).css3({
					'transition-duration': '1600ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'all',
					'mask-image': '-webkit-linear-gradient(left, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 52%, rgba(0,0,0,1) 100%)',
					'mask-position': '70%',
					'mask-size': '400%'
				});
				
				this.slider.image1.append(img);
			},
			execute: function() {
				//return;
				var _this = this,
					img = this.slider.image1.find('div');

				// Get notified when the last transition has completed
				$(img).transitionEnd(function(){
					_this.finished();
				});

				setTimeout(function(){
					$(img).css3({
						'mask-position': '30%'
					});
				}, 50);
			},
			compatibilityCheck: function() {
				return flux.browser.supportsCSSProperty('MaskImage');
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

(function($) {
	flux.transitions.dissolve = function(fluxslider, opts) {
		return new flux.transition(fluxslider, $.extend({
			setup: function() {
				var img = $('<div class="image"></div>').css({
					width: '100%',
					height: '100%',
					'background-image': this.slider.image1.css('background-image')	
				}).css3({
					'transition-duration': '600ms',
					'transition-timing-function': 'ease-in',
					'transition-property': 'opacity'
				});
				
				this.slider.image1.append(img);
			},
			execute: function() {
				var _this = this,
					img = this.slider.image1.find('div.image');

				// Get notified when the last transition has completed
				$(img).transitionEnd(function(){
					_this.finished();
				});

				setTimeout(function(){
					$(img).css({
						'opacity': '0.0'
					});
				}, 50);
			}
		}, opts));
	};
})(window.jQuery || window.Zepto);

/**
 *
 * Version: 0.0.3
 * Author: Gianluca Guarini
 * Contact: gianluca.guarini@gmail.com
 * Website: http://www.gianlucaguarini.com/
 * Twitter: @gianlucaguarini
 *
 * Copyright (c) 2013 Gianluca Guarini
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 **/

;(function(window, document, $) {
  "use strict";

  // Plugin private cache

  var cache = {
    filterId: 0
  };

  var Vague = function(elm, customOptions) {
    // Default oprions
    var defaultOptions = {
      intensity: 5
    },
      options = $.extend(defaultOptions, customOptions);

    /*
     *
     * PUBLIC VARS
     *
     */

    this.$elm = elm instanceof $ ? elm : $(elm);

    /*
     *
     * PRIVATE VARS
     *
     */


    var blurred = false;

    /*
     *
     * features detection
     *
     */

    var browserPrefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

    var cssPrefixString = {};
    var cssPrefix = function(property) {
      if (cssPrefixString[property] || cssPrefixString[property] === '') return cssPrefixString[property] + property;
      var e = document.createElement('div');
      var prefixes = ['', 'Moz', 'Webkit', 'O', 'ms', 'Khtml']; // Various supports...
      for (var i in prefixes) {
        if (typeof e.style[prefixes[i] + property] !== 'undefined') {
          cssPrefixString[property] = prefixes[i];
          return prefixes[i] + property;
        }
      }
      return property.toLowerCase();
    };

    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/css-filters.js
    var cssfilters = function() {
      var el = document.createElement('div');
      el.style.cssText = browserPrefixes.join('filter' + ':blur(2px); ');
      return !!el.style.length && ((document.documentMode === undefined || document.documentMode > 9));
    }();

    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/svg-filters.js
    var svgfilters = function() {
      var result = false;
      try {
        result = typeof SVGFEColorMatrixElement !== undefined &&
          SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE == 2;
      } catch (e) {}
      return result;
    }();

    /*
     *
     * PRIVATE METHODS
     *
     */

    var appendSVGFilter = function() {

      var filterMarkup = "<svg id='vague-svg-blur' style='position:absolute;' width='0' height='0' >" +
        "<filter id='blur-effect-id-" + cache.filterId + "'>" +
        "<feGaussianBlur stdDeviation='" + options.intensity + "' />" +
        "</filter>" +
        "</svg>";

      $("body").append(filterMarkup);

    };

    /*
     *
     * PUBLIC METHODS
     *
     */

    this.init = function() {
      // checking the css filter feature

      if (svgfilters) {
        appendSVGFilter();
      }

      this.$elm.data("vague-filter-id", cache.filterId);

      cache.filterId++;

    };

    this.blur = function() {
      var filterValue,
        filterId = this.$elm.data("vague-filter-id"),
        cssProp = {};
      if (cssfilters) {
        filterValue = "blur(" + options.intensity + "px)";
      } else if (svgfilters) {
        filterValue = "url(#blur-effect-id-" + filterId + ")";
      } else {
        filterValue = "progid:DXImageTransform.Microsoft.Blur(pixelradius=" + options.intensity + ")";
      }
      cssProp[cssPrefix('Filter')] = filterValue;

      this.$elm.css(cssProp);

      blurred = true;
    };

    this.unblur = function() {
      var cssProp = {};
      cssProp[cssPrefix('Filter')] = "none";
      this.$elm.css(cssProp);
      blurred = false;
    };

    this.toggleblur = function() {
      if (blurred) {
        this.unblur();
      } else {
        this.blur();
      }
    };

    this.destroy = function() {
      if (svgfilters) {
        $("filter#blur-effect-id-" + this.$elm.data("vague-filter-id")).parent().remove();
      }
      this.unblur();
    };
    return this.init();
  };

  $.fn.Vague = function(options) {
    return new Vague(this, options);
  };

  window.Vague = Vague;

}(window, document, jQuery));
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Moller. fixes from Paul Irish and Tino Zijdel
 
// MIT license
 
(function() {
var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];
for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
|| window[vendors[x]+'CancelRequestAnimationFrame'];
}
if (!window.requestAnimationFrame)
window.requestAnimationFrame = function(callback, element) {
var currTime = new Date().getTime();
var timeToCall = Math.max(0, 16 - (currTime - lastTime));
var id = window.setTimeout(function() { callback(currTime + timeToCall); },
timeToCall);
lastTime = currTime + timeToCall;
return id;
};
if (!window.cancelAnimationFrame)
window.cancelAnimationFrame = function(id) {
clearTimeout(id);
};
}());
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright 횂짤 2001 Robert Penner
 * All rights reserved.
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright 횂짤 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/
jQuery.easing.jswing=jQuery.easing.swing;jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(e,f,a,h,g){return jQuery.easing[jQuery.easing.def](e,f,a,h,g)},easeInQuad:function(e,f,a,h,g){return h*(f/=g)*f+a},easeOutQuad:function(e,f,a,h,g){return -h*(f/=g)*(f-2)+a},easeInOutQuad:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f+a}return -h/2*((--f)*(f-2)-1)+a},easeInCubic:function(e,f,a,h,g){return h*(f/=g)*f*f+a},easeOutCubic:function(e,f,a,h,g){return h*((f=f/g-1)*f*f+1)+a},easeInOutCubic:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f+a}return h/2*((f-=2)*f*f+2)+a},easeInQuart:function(e,f,a,h,g){return h*(f/=g)*f*f*f+a},easeOutQuart:function(e,f,a,h,g){return -h*((f=f/g-1)*f*f*f-1)+a},easeInOutQuart:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f+a}return -h/2*((f-=2)*f*f*f-2)+a},easeInQuint:function(e,f,a,h,g){return h*(f/=g)*f*f*f*f+a},easeOutQuint:function(e,f,a,h,g){return h*((f=f/g-1)*f*f*f*f+1)+a},easeInOutQuint:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f*f+a}return h/2*((f-=2)*f*f*f*f+2)+a},easeInSine:function(e,f,a,h,g){return -h*Math.cos(f/g*(Math.PI/2))+h+a},easeOutSine:function(e,f,a,h,g){return h*Math.sin(f/g*(Math.PI/2))+a},easeInOutSine:function(e,f,a,h,g){return -h/2*(Math.cos(Math.PI*f/g)-1)+a},easeInExpo:function(e,f,a,h,g){return(f==0)?a:h*Math.pow(2,10*(f/g-1))+a},easeOutExpo:function(e,f,a,h,g){return(f==g)?a+h:h*(-Math.pow(2,-10*f/g)+1)+a},easeInOutExpo:function(e,f,a,h,g){if(f==0){return a}if(f==g){return a+h}if((f/=g/2)<1){return h/2*Math.pow(2,10*(f-1))+a}return h/2*(-Math.pow(2,-10*--f)+2)+a},easeInCirc:function(e,f,a,h,g){return -h*(Math.sqrt(1-(f/=g)*f)-1)+a},easeOutCirc:function(e,f,a,h,g){return h*Math.sqrt(1-(f=f/g-1)*f)+a},easeInOutCirc:function(e,f,a,h,g){if((f/=g/2)<1){return -h/2*(Math.sqrt(1-f*f)-1)+a}return h/2*(Math.sqrt(1-(f-=2)*f)+1)+a},easeInElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return -(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e},easeOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return g*Math.pow(2,-10*h)*Math.sin((h*k-i)*(2*Math.PI)/j)+l+e},easeInOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k/2)==2){return e+l}if(!j){j=k*(0.3*1.5)}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}if(h<1){return -0.5*(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e}return g*Math.pow(2,-10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j)*0.5+l+e},easeInBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*(f/=h)*f*((g+1)*f-g)+a},easeOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*((f=f/h-1)*f*((g+1)*f+g)+1)+a},easeInOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}if((f/=h/2)<1){return i/2*(f*f*(((g*=(1.525))+1)*f-g))+a}return i/2*((f-=2)*f*(((g*=(1.525))+1)*f+g)+2)+a},easeInBounce:function(e,f,a,h,g){return h-jQuery.easing.easeOutBounce(e,g-f,0,h,g)+a},easeOutBounce:function(e,f,a,h,g){if((f/=g)<(1/2.75)){return h*(7.5625*f*f)+a}else{if(f<(2/2.75)){return h*(7.5625*(f-=(1.5/2.75))*f+0.75)+a}else{if(f<(2.5/2.75)){return h*(7.5625*(f-=(2.25/2.75))*f+0.9375)+a}else{return h*(7.5625*(f-=(2.625/2.75))*f+0.984375)+a}}}},easeInOutBounce:function(e,f,a,h,g){if(f<g/2){return jQuery.easing.easeInBounce(e,f*2,0,h,g)*0.5+a}return jQuery.easing.easeOutBounce(e,f*2-g,0,h,g)*0.5+h*0.5+a}});
/*

FLIPPY jQuery plugin (http://guilhemmarty.com/flippy)
Released under MIT Licence (http://www.opensource.org/licenses/MIT)

@author : Guilhem MARTY (bonjour@guilhemmarty.com)

@version: 1.3

@changelog:

 May 21 2013 - v1.3 : added revert callbacks, direction option is not case sensitive
 
 Apr 06 2013 - v1.2 : can now use CSS3 transform property for better visual result in modern web browsers

 Apr 03 2013 - v1.1 : code cleanup (Object Oriented) + add Revert action + add onAnimation callback

 Mar 30 2013 - v1.0.3 : bug fix on IE8/IE9 with explorerCanvas + add multiple simultaneous flippy animations

 Mar 17 2013 - v1.0.2 : bug fix with IE10+. Can use rgba in color and color target

 Feb 11 2012 - v1.0.1 : bug fix with IE9

 Feb 11 2012 - v1.0 : First release

*/
(function(e){function n(){e("document").ready(function(){var e=document.createElement("p"),t,n={webkitTransform:"-webkit-transform",OTransform:"-o-transform",msTransform:"-ms-transform",MozTransform:"-moz-transform",transform:"transform"};document.body.appendChild(e);for(var r in n){if(e.style[r]!==undefined){e.style[r]="rotateX(1deg)";t=window.getComputedStyle(e).getPropertyValue(n[r])}}document.body.removeChild(e);s=t!==undefined&&t.length>0&&t!=="none"})}var t={aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgrey:"#a9a9a9",darkgreen:"#006400",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",grey:"#808080",green:"#008000",greenyellow:"#adff2f",honeydew:"#f0fff0",hotpink:"#ff69b4","indianred ":"#cd5c5c","indigo  ":"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",lightgrey:"#d3d3d3",lightgreen:"#90ee90",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370d8",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#d87093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"};var r=navigator.appName=="Microsoft Internet Explorer";var i=window.HTMLCanvasElement;var s=null;n();var o=Math.PI;var u=function(n,u,a){this.animate=function(t){if(t){this._RBefore()}else{this._Before()}if(typeof t!==a&&t){var n=this._Recto;var r=this._Recto_color;this._Recto=this._Verso;this._Color=this._Recto_color=this._Verso_color;this._Verso=n;this._Color_target=this._Verso_color=r;this._Reversing=true;switch(this._Direction){case"TOP":this._Direction="BOTTOM";break;case"BOTTOM":this._Direction="TOP";break;case"LEFT":this._Direction="RIGHT";break;case"RIGHT":this._Direction="LEFT";break}}if(this._noCSS||!s){this.initiateFlippy();this.cvO=document.getElementById("flippy"+this._UID);this.jO.data("_oFlippy_",this);this._Int=setInterval(e.proxy(this.drawFlippy,this),this._Refresh_rate)}else{this.jO.addClass("flippy_active").parent().css({perspective:this._nW+"px"});this.jO.data("_oFlippy_",this);this._Int=setInterval(e.proxy(this.drawFlippyCSS,this),this._Refresh_rate)}};this.drawFlippyCSS=function(){this._Ang=this._Direction=="RIGHT"||this._Direction=="TOP"?this._Ang+this._Step_ang:this._Ang-this._Step_ang;var e=this._Direction=="RIGHT"||this._Direction=="LEFT"?"Y":"X";if((this._Direction=="RIGHT"||this._Direction=="TOP")&&this._Ang>90&&this._Ang<=90+this._Step_ang||(this._Direction=="LEFT"||this._Direction=="BOTTOM")&&this._Ang<-90&&this._Ang>=-90-this._Step_ang){if(this._Reversing){this._RMidway()}else{this._Midway()}this.jO.css({opacity:this._Color_target_alpha,background:this._Color_target}).empty().append(this._Verso);this._Ang=this._Direction=="RIGHT"||this._Direction=="TOP"?-90:90;this._Half=true}if(this._Direction=="RIGHT"||this._Direction=="TOP"){this._Ang=this._Ang>this._Step_ang&&this._Half?this._Ang-this._Step_ang:this._Ang}else{this._Ang=this._Ang<-this._Step_ang&&this._Half?this._Ang+this._Step_ang:this._Ang}if((this._Direction=="RIGHT"||this._Direction=="TOP")&&this._Ang>0&&this._Half||(this._Direction=="LEFT"||this._Direction=="BOTTOM")&&this._Ang<0&&this._Half){this.jO.removeClass("flippy_active").css({"-webkit-transform":"rotate"+e+"(0deg)","-moz-transform":"rotate"+e+"(0deg)","-o-transform":"rotate"+e+"(0deg)","-ms-transform":"rotate"+e+"(0deg)",transform:"rotate"+e+"(0deg)"}).find(".flippy_light").remove();clearInterval(this._Int);this._Half=false;if(this._Reversing){this._RAfter()}else{this._After()}return}else{this.jO.css({"-webkit-transform":"rotate"+e+"("+this._Ang+"deg)","-moz-transform":"rotate"+e+"("+this._Ang+"deg)","-o-transform":"rotate"+e+"("+this._Ang+"deg)","-ms-transform":"rotate"+e+"("+this._Ang+"deg)",transform:"rotate"+e+"("+this._Ang+"deg)"})}this.applyLight();if(this._Reversing){this._RDuring()}else{this._During()}};this.applyLight=function(){if(this.jO.find(".flippy_light").size()===0){this.jO.append('<div class="flippy_light"></div>').find(".flippy_light").css({position:"absolute",top:"0",left:"0","min-width":this._nW+"px","min-height":this._nH+"px",width:this._nW+"px",height:this._nH+"px","background-color":this._Direction=="LEFT"&&this._Half||this._Direction=="RIGHT"&&!this._Half||this._Direction=="TOP"&&this._Half||this._Direction=="BOTTOM"&&!this._Half?"#000":"#FFF",opacity:Math.abs(this._Ang)*this._Light/90/100})}else{this.jO.find(".flippy_light").css({"background-color":this._Direction=="LEFT"&&this._Half||this._Direction=="RIGHT"&&!this._Half||this._Direction=="TOP"&&this._Half||this._Direction=="BOTTOM"&&!this._Half?"#000":"#FFF",opacity:Math.abs(this._Ang)*this._Light/90/100})}};this.initiateFlippy=function(){var e;this.jO.addClass("flippy_active").empty().css({opacity:this._Color_alpha,background:"none",position:"relative",overflow:"visible"});switch(this._Direction){case"TOP":this._CenterX=Math.sin(o/2)*this._nW*this._Depth;this._CenterY=this._H/2;e='<canvas id="flippy'+this._UID+'" class="flippy" width="'+(this._W+2*this._CenterX)+'" height="'+this._H+'"></canvas>';this.new_flippy(e);this.jO.find("#flippy"+this._UID).css({position:"absolute",top:"0",left:"-"+this._CenterX+"px"});break;case"BOTTOM":this._CenterX=Math.sin(o/2)*this._nW*this._Depth;this._CenterY=this._H/2;e='<canvas id="flippy'+this._UID+'" class="flippy" width="'+(this._W+2*this._CenterX)+'" height="'+this._H+'"></canvas>';this.new_flippy(e);this.jO.find("#flippy"+this._UID).css({position:"absolute",top:"0",left:"-"+this._CenterX+"px"});break;case"LEFT":this._CenterY=Math.sin(o/2)*this._nH*this._Depth;this._CenterX=this._W/2;e='<canvas id="flippy'+this._UID+'" class="flippy" width="'+this._W+'" height="'+(this._H+2*this._CenterY)+'"></canvas>';this.new_flippy(e);this.jO.find("#flippy"+this._UID).css({position:"absolute",top:"-"+this._CenterY+"px",left:"0"});break;case"RIGHT":this._CenterY=Math.sin(o/2)*this._nH*this._Depth;this._CenterX=this._W/2;e='<canvas id="flippy'+this._UID+'" class="flippy" width="'+this._W+'" height="'+(this._H+2*this._CenterY)+'"></canvas>';this.new_flippy(e);this.jO.find("#flippy"+this._UID).css({position:"absolute",top:"-"+this._CenterY+"px",left:"0"});break}};this.drawFlippy=function(){this._Ang+=this._Step_ang;if(this._Ang>90&&this._Ang<=90+this._Step_ang){if(this._Reversing){this._RMidway()}else{this._Midway()}this.jO.css({opacity:this._Color_target_alpha})}this._Ang=this._Ang>180+this._Step_ang?this._Ang-(180+this._Step_ang):this._Ang;var e=this._Ang/180*o;if(this.cvO===null){return}if(r&&!i){G_vmlCanvasManager.initElement(this.cvO)}var t=this.cvO.getContext("2d");t.clearRect(0,0,this._W+2*this._CenterX,this._H+2*this._CenterY);t.beginPath();var n=Math.sin(e)*this._H*this._Depth;var s=Math.sin(e)*this._W*this._Depth;var u,a;switch(this._Direction){case"LEFT":u=Math.cos(e)*(this._W/2);t.fillStyle=this._Ang>90?this.changeColor(this._Color_target,Math.floor(Math.sin(e)*this._Light)):this.changeColor(this._Color,-Math.floor(Math.sin(e)*this._Light));t.moveTo(this._CenterX-u,this._CenterY+n);t.lineTo(this._CenterX+u,this._CenterY-n);t.lineTo(this._CenterX+u,this._CenterY+this._H+n);t.lineTo(this._CenterX-u,this._CenterY+this._H-n);t.lineTo(this._CenterX-u,this._CenterY);t.fill();break;case"RIGHT":u=Math.cos(e)*(this._W/2);t.fillStyle=this._Ang>90?this.changeColor(this._Color_target,-Math.floor(Math.sin(e)*this._Light)):this.changeColor(this._Color,Math.floor(Math.sin(e)*this._Light));t.moveTo(this._CenterX+u,this._CenterY+n);t.lineTo(this._CenterX-u,this._CenterY-n);t.lineTo(this._CenterX-u,this._CenterY+this._H+n);t.lineTo(this._CenterX+u,this._CenterY+this._H-n);t.lineTo(this._CenterX+u,this._CenterY);t.fill();break;case"TOP":a=Math.cos(e)*(this._H/2);t.fillStyle=this._Ang>90?this.changeColor(this._Color_target,-Math.floor(Math.sin(e)*this._Light)):this.changeColor(this._Color,Math.floor(Math.sin(e)*this._Light));t.moveTo(this._CenterX+s,this._CenterY-a);t.lineTo(this._CenterX-s,this._CenterY+a);t.lineTo(this._CenterX+this._W+s,this._CenterY+a);t.lineTo(this._CenterX+this._W-s,this._CenterY-a);t.lineTo(this._CenterX,this._CenterY-a);t.fill();break;case"BOTTOM":a=Math.cos(e)*(this._H/2);t.fillStyle=this._Ang>90?this.changeColor(this._Color_target,Math.floor(Math.sin(e)*this._Light)):this.changeColor(this._Color,-Math.floor(Math.sin(e)*this._Light));t.moveTo(this._CenterX+s,this._CenterY+a);t.lineTo(this._CenterX-s,this._CenterY-a);t.lineTo(this._CenterX+this._W+s,this._CenterY-a);t.lineTo(this._CenterX+this._W-s,this._CenterY+a);t.lineTo(this._CenterX,this._CenterY+a);t.fill();break}if(this._Ang>180){this.jO.removeClass("flippy_active").css({background:this._Color_target}).append(this._Verso).removeClass("flippy_container").find(".flippy").remove();clearInterval(this._Int);if(this._Reversing){this._RAfter()}else{this._After()}return}if(this._Reversing){this._RDuring()}else{this._During()}};this.new_flippy=function(e){if(r&&!i){this.jO.addClass("flippy_container").attr("id","flippy_container"+this._UID);var t=document.getElementById("flippy_container"+this._UID);var n=document.createElement(e);t.appendChild(n)}else{this.jO.append(e)}};this.convertColor=function(e){var n=t.hasOwnProperty(e)?t[e]:e;if(/^transparent$/i.test(n))return"#ffffff";if(n.substr(0,4)=="rgb("){return["#",this.toHex(n.substr(4,n.length).split(",")[0]>>>0),this.toHex(n.substr(3,n.length).split(",")[1]>>>0),this.toHex(n.substr(3,n.length-4).split(",")[2]>>>0)].join("")}if(n.substr(0,5)=="rgba("){return["#",this.toHex(n.substr(5,n.length).split(",")[0]>>>0),this.toHex(n.substr(3,n.length).split(",")[1]>>>0),this.toHex(n.substr(3,n.length-4).split(",")[2]>>>0)].join("")}return n};this.toHex=function(e){var t=[];while(Math.floor(e)>16){t.push(e%16);e=Math.floor(e/16)}var n,r;switch(e){case 10:n="A";break;case 11:n="B";break;case 12:n="C";break;case 13:n="D";break;case 14:n="E";break;case 15:n="F";break;default:n=""+e;break}for(r=t.length-1;r>=0;r--){switch(t[r]){case 10:n+="A";break;case 11:n+="B";break;case 12:n+="C";break;case 13:n+="D";break;case 14:n+="E";break;case 15:n+="F";break;default:n+=""+t[r];break}}if(n.length==1){return"0"+n}else{return n}};this.changeColor=function(e,t){var n=e.substr(1,2);var r=e.substr(3,2);var i=e.substr(5,2);var s=parseInt(n,16)+t>255?255:parseInt(n,16)+t;var o=parseInt(r,16)+t>255?255:parseInt(r,16)+t;var u=parseInt(i,16)+t>255?255:parseInt(i,16)+t;n=s<=0?"00":this.toHex(s);r=o<=0?"00":this.toHex(o);i=u<=0?"00":this.toHex(u);return"#"+n+r+i};u=e.extend({step_ang:10,refresh_rate:15,duration:300,depth:.12,color_target:"white",light:60,content:"",direction:"LEFT",noCSS:false,onStart:function(){},onMidway:function(){},onAnimation:function(){},onFinish:function(){},onReverseStart:function(){},onReverseMidway:function(){},onReverseAnimation:function(){},onReverseFinish:function(){}},u);this._Reversing=false;this._Half=false;this._UID=Math.floor(Math.random()*1e6);this.jO=n;this._noCSS=u.noCSS;this._Ang=0;this._Step_ang=u.refresh_rate/u.duration*200;this._Refresh_rate=u.refresh_rate;this._Duration=u.duration;this._Depth=u.depth;this._Color_target_is_rgba=u.color_target.substr(0,5)=="rgba(";this._Color=n.css("background-color");this._Color_target_alpha=this._Color_target_is_rgba?u.color_target.substr(3,u.color_target.length-4).split(",")[3]>>>0:1;this._Color_alpha=/^transparent$/i.test(""+this._Color)?0:this._Color.substr(0,5)=="rgba("?this._Color.substr(3,this._Color.length-4).split(",")[3]>>>0:1;this._Color_target=this.convertColor(u.color_target);this._Color=this.convertColor(this._Color);this._Direction=u.direction.toUpperCase();this._Light=u.light;this._Content=typeof u.content=="object"?u.content.html():u.content;this._Recto_color=this._Color;this._Verso_color=this._Color_target;this._Recto=u.recto!==a?u.recto:this.jO.html();this._Verso=u.verso!==a?u.verso:this._Content;this._Before=u.onStart;this._During=u.onAnimation;this._Midway=u.onMidway;this._After=u.onFinish;this._RBefore=u.onReverseStart;this._RDuring=u.onReverseAnimation;this._RMidway=u.onReverseMidway;this._RAfter=u.onReverseFinish;this._nW=this.jO.width();this._nH=this.jO.height();this._W=this.jO.outerWidth();this._H=this.jO.outerHeight();u=null};e.fn.flippy=function(t){return this.each(function(){$t=e(this);if(!$t.hasClass("flippy_active")){var n=new u($t,t);n.animate()}})};e.fn.flippyReverse=function(){return this.each(function(){$t=e(this);if(!$t.hasClass("flippy_active")){var t=$t.data("_oFlippy_");t.animate(true)}})}})(jQuery);
																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																														/*
 * jQuery Framerate 1.0.1
 *
 ** IMPORTANT: THIS HAS ONLY BEEN TESTED WITH JQUERY 1.4.2.  SINCE THIS PLUGIN MODIFIES PARTS OF THE
 ** CORE CODE, IT MAY NOT WORK CORRECTLY IN OTHER VERSIONS. LET ME KNOW IF YOU FIND ANOTHER
 ** VERSION IT DOESN'T WORK IN AND I'LL SEE IF I CAN MODIFY TO WORK WITH IT
 *
 *
 * Summary:
 * Override some of the core code of JQuery to allow for custom framerates
 * The default framerate is very high (@77fps) and can therefore lead to choppy motion on
 * complicated animations on slower machines
 *
 * Usage:
 * takes two parameters, one for desired framerate (default of 30) and other to display
 * framerate in console while animation is running.
 *
 * example basic usage: $().framerate();
 * example advanced usage: $().framerate({framerate: 20, logframes: true});
 *
 *
 *
 * TERMS OF USE - jQuery Framerate
 *
 * Copyright � 2010 James Snodgrass: jim@skookum.com
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *
 * Changes:
 * 1.0.1: July 30,2010 - fixed global variable leaks
 *
*/

(function($) {
jQuery.fn.framerate = function(options) {


var settings = jQuery.extend({
   framerate: 30,
   logframes: false
}, options);

var frameInterval = Math.floor(1000/settings.framerate);

jQuery.extend( jQuery.fx.prototype, {
	// Start an animation from one number to another
	custom: function( from, to, unit ) {
		this.startTime = new Date().getTime();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;

		var self = this;
		function t( gotoEnd ) {
			return self.step(gotoEnd);
		}

		t.elem = this.elem;
		
		if (typeof(jQuery.timerId) == 'undefined') jQuery.timerId = false;
		
		if ( t() && jQuery.timers.push(t) && !jQuery.timerId ) {
			jQuery.timerId = setInterval(jQuery.fx.tick, frameInterval);
		}
	}
});

var lastTimeStamp = new Date().getTime();  

jQuery.extend( jQuery.fx, {
	tick: function() {
		
		if (settings.logframes) {
			var now = new Date().getTime();
    		lastTimeStamp = now;
		}
		 
		
		var timers = jQuery.timers;
		
		for ( var i = 0; i < timers.length; i++ ) {
			if ( !timers[i]() ) {
				timers.splice(i--, 1);
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
	},
	stop: function() {
		clearInterval( jQuery.timerId );
		jQuery.timerId = null;
	}
});

}
})(jQuery);
/*!jQuery Knob*/
/**
 * Downward compatible, touchable dial
 *
 * Version: 1.2.0 (15/07/2012)
 * Requires: jQuery v1.7+
 *
 * Copyright (c) 2012 Anthony Terrien
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 * Thanks to vor, eskimoblood, spiffistan, FabrizioC
 */
(function($) {

    /**
     * Kontrol library
     */
    "use strict";

    /**
     * Definition of globals and core
     */
    var k = {}, // kontrol
        max = Math.max,
        min = Math.min;

    k.c = {};
    k.c.d = $(document);
    k.c.t = function (e) {
        return e.originalEvent.touches.length - 1;
    };

    /**
     * Kontrol Object
     *
     * Definition of an abstract UI control
     *
     * Each concrete component must call this one.
     * <code>
     * k.o.call(this);
     * </code>
     */
    k.o = function () {
        var s = this;

        this.o = null; // array of options
        this.$ = null; // jQuery wrapped element
        this.i = null; // mixed HTMLInputElement or array of HTMLInputElement
        this.g = null; // deprecated 2D graphics context for 'pre-rendering'
        this.v = null; // value ; mixed array or integer
        this.cv = null; // change value ; not commited value
        this.x = 0; // canvas x position
        this.y = 0; // canvas y position
        this.w = 0; // canvas width
        this.h = 0; // canvas height
        this.$c = null; // jQuery canvas element
        this.c = null; // rendered canvas context
        this.t = 0; // touches index
        this.isInit = false;
        this.fgColor = null; // main color
        this.pColor = null; // previous color
        this.dH = null; // draw hook
        this.cH = null; // change hook
        this.eH = null; // cancel hook
        this.rH = null; // release hook
        this.scale = 1; // scale factor
        this.relative = false;
        this.relativeWidth = false;
        this.relativeHeight = false;
        this.$div = null; // component div

        this.run = function () {
            var cf = function (e, conf) {
                var k;
                for (k in conf) {
                    s.o[k] = conf[k];
                }
                s.init();
                s._configure()
                 ._draw();
            };

            if(this.$.data('kontroled')) return;
            this.$.data('kontroled', true);

            this.extend();
            this.o = $.extend(
                {
                    // Config
                    min : this.$.data('min') || 0,
                    max : this.$.data('max') || 100,
                    stopper : true,
                    readOnly : this.$.data('readonly') || (this.$.attr('readonly') == 'readonly'),

                    // UI
                    cursor : (this.$.data('cursor') === true && 30)
                                || this.$.data('cursor')
                                || 0,
                    thickness : this.$.data('thickness') || 0.35,
                    lineCap : this.$.data('linecap') || 'butt',
                    width : this.$.data('width') || 200,
                    height : this.$.data('height') || 200,
                    displayInput : this.$.data('displayinput') == null || this.$.data('displayinput'),
                    displayPrevious : this.$.data('displayprevious'),
                    fgColor : this.$.data('fgcolor') || '#87CEEB',
                    inputColor: this.$.data('inputcolor') || this.$.data('fgcolor') || '#aaaaaa',
                    font: this.$.data('font') || 'Arial',
                    fontWeight: this.$.data('font-weight') || 'bold',
                    inline : false,
                    step : this.$.data('step') || 1,

                    // Hooks
                    draw : null, // function () {}
                    change : null, // function (value) {}
                    cancel : null, // function () {}
                    release : null, // function (value) {}
                    error : null // function () {}
                }, this.o
            );

            // routing value
            if(this.$.is('fieldset')) {

                // fieldset = array of integer
                this.v = {};
                this.i = this.$.find('input')
                this.i.each(function(k) {
                    var $this = $(this);
                    s.i[k] = $this;
                    s.v[k] = $this.val();

                    $this.bind(
                        'change'
                        , function () {
                            var val = {};
                            val[k] = $this.val();
                            s.val(val);
                        }
                    );
                });
                this.$.find('legend').remove();

            } else {

                // input = integer
                this.i = this.$;
                this.v = this.$.val();
                (this.v == '') && (this.v = this.o.min);

                this.$.bind(
                    'change'
                    , function () {
                        s.val(s._validate(s.$.val()));
                    }
                );

            }

            (!this.o.displayInput) && this.$.hide();

            // adds needed DOM elements (canvas, div)
            this.$c = $(document.createElement('canvas'));
            if (typeof G_vmlCanvasManager !== 'undefined') {
              G_vmlCanvasManager.initElement(this.$c[0]);
            }
            this.c = this.$c[0].getContext ? this.$c[0].getContext('2d') : null;
            if (!this.c) {
                this.o.error && this.o.error();
                return;
            }

            // hdpi support
            this.scale = (window.devicePixelRatio || 1) /
                        (
                            this.c.webkitBackingStorePixelRatio ||
                            this.c.mozBackingStorePixelRatio ||
                            this.c.msBackingStorePixelRatio ||
                            this.c.oBackingStorePixelRatio ||
                            this.c.backingStorePixelRatio || 1
                        );

            // detects relative width / height
            this.relativeWidth = ((this.o.width % 1 !== 0)
                                    && this.o.width.indexOf('%'));
            this.relativeHeight = ((this.o.height % 1 !== 0)
                                    && this.o.height.indexOf('%'));

            this.relative = (this.relativeWidth || this.relativeHeight);

            // wraps all elements in a div
            this.$div = $('<div style="'
                        + (this.o.inline ? 'display:inline;' : '')
                        + '"></div>');

            this.$.wrap(this.$div).before(this.$c);
            this.$div = this.$.parent();

            // computes size and carves the component
            this._carve();

            // prepares props for transaction
            if (this.v instanceof Object) {
                this.cv = {};
                this.copy(this.v, this.cv);
            } else {
                this.cv = this.v;
            }

            // binds configure event
            this.$
                .bind("configure", cf)
                .parent()
                .bind("configure", cf);

            // finalize init
            this._listen()
                ._configure()
                ._xy()
                .init();

            this.isInit = true;

            // the most important !
            this._draw();

            return this;
        };

        this._carve = function() {
            if(this.relative) {
                var w = this.relativeWidth
                            ? this.$div.parent().width()
                                * parseInt(this.o.width) / 100
                            : this.$div.parent().width(),
                    h = this.relativeHeight
                            ? this.$div.parent().height()
                                * parseInt(this.o.height) / 100
                            : this.$div.parent().height();

                // apply relative
                this.w = this.h = Math.min(w, h);
            } else {
                this.w = this.o.width;
                this.h = this.o.height;
            }

            // finalize div
            this.$div.css({
                'width': this.w + 'px',
                'height': this.h + 'px'
            });

            // finalize canvas with computed width
            this.$c.attr({
                width: this.w,
                height: this.h
            });

            // scaling
            if (this.scale !== 1) {
                this.$c[0].width = this.$c[0].width * this.scale;
                this.$c[0].height = this.$c[0].height * this.scale;
                this.$c.width(this.w);
                this.$c.height(this.h);
            }

            return this;
        }

        this._draw = function () {

            // canvas pre-rendering
            var d = true;

            s.g = s.c;

            s.clear();

            s.dH
            && (d = s.dH());

            (d !== false) && s.draw();

        };

        this._touch = function (e) {

            var touchMove = function (e) {

                var v = s.xy2val(
                            e.originalEvent.touches[s.t].pageX,
                            e.originalEvent.touches[s.t].pageY
                            );

                if (v == s.cv) return;

                if (
                    s.cH
                    && (s.cH(v) === false)
                ) return;


                s.change(s._validate(v));
                s._draw();
            };

            // get touches index
            this.t = k.c.t(e);

            // First touch
            touchMove(e);

            // Touch events listeners
            k.c.d
                .bind("touchmove.k", touchMove)
                .bind(
                    "touchend.k"
                    , function () {
                        k.c.d.unbind('touchmove.k touchend.k');

                        if (
                            s.rH
                            && (s.rH(s.cv) === false)
                        ) return;

                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._mouse = function (e) {

            var mouseMove = function (e) {
                var v = s.xy2val(e.pageX, e.pageY);
                if (v == s.cv) return;

                if (
                    s.cH
                    && (s.cH(v) === false)
                ) return;

                s.change(s._validate(v));
                s._draw();
            };

            // First click
            mouseMove(e);

            // Mouse events listeners
            k.c.d
                .bind("mousemove.k", mouseMove)
                .bind(
                    // Escape key cancel current change
                    "keyup.k"
                    , function (e) {
                        if (e.keyCode === 27) {
                            k.c.d.unbind("mouseup.k mousemove.k keyup.k");

                            if (
                                s.eH
                                && (s.eH() === false)
                            ) return;

                            s.cancel();
                        }
                    }
                )
                .bind(
                    "mouseup.k"
                    , function (e) {
                        k.c.d.unbind('mousemove.k mouseup.k keyup.k');

                        if (
                            s.rH
                            && (s.rH(s.cv) === false)
                        ) return;

                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._xy = function () {
            var o = this.$c.offset();
            this.x = o.left;
            this.y = o.top;
            return this;
        };

        this._listen = function () {

            if (!this.o.readOnly) {
                this.$c
                    .bind(
                        "mousedown"
                        , function (e) {
                            e.preventDefault();
                            s._xy()._mouse(e);
                         }
                    )
                    .bind(
                        "touchstart"
                        , function (e) {
                            e.preventDefault();
                            s._xy()._touch(e);
                         }
                    );

                if(this.relative) {
                    $(window).resize(function() {
                        s._carve()
                         .init();
                        s._draw();
                    });
                }

                this.listen();
            } else {
                this.$.attr('readonly', 'readonly');
            }

            return this;
        };

        this._configure = function () {

            // Hooks
            if (this.o.draw) this.dH = this.o.draw;
            if (this.o.change) this.cH = this.o.change;
            if (this.o.cancel) this.eH = this.o.cancel;
            if (this.o.release) this.rH = this.o.release;

            if (this.o.displayPrevious) {
                this.pColor = this.h2rgba(this.o.fgColor, "0.4");
                this.fgColor = this.h2rgba(this.o.fgColor, "0.6");
            } else {
                this.fgColor = this.o.fgColor;
            }

            return this;
        };

        this._clear = function () {
            this.$c[0].width = this.$c[0].width;
        };

        this._validate = function(v) {
            return (~~ (((v < 0) ? -0.5 : 0.5) + (v/this.o.step))) * this.o.step;
        };

        // Abstract methods
        this.listen = function () {}; // on start, one time
        this.extend = function () {}; // each time configure triggered
        this.init = function () {}; // each time configure triggered
        this.change = function (v) {}; // on change
        this.val = function (v) {}; // on release
        this.xy2val = function (x, y) {}; //
        this.draw = function () {}; // on change / on release
        this.clear = function () { this._clear(); };

        // Utils
        this.h2rgba = function (h, a) {
            var rgb;
            h = h.substring(1,7)
            rgb = [parseInt(h.substring(0,2),16)
                   ,parseInt(h.substring(2,4),16)
                   ,parseInt(h.substring(4,6),16)];
            return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
        };

        this.copy = function (f, t) {
            for (var i in f) { t[i] = f[i]; }
        };
    };


    /**
     * k.Dial
     */
    k.Dial = function () {
        k.o.call(this);

        this.startAngle = null;
        this.xy = null;
        this.radius = null;
        this.lineWidth = null;
        this.cursorExt = null;
        this.w2 = null;
        this.PI2 = 2*Math.PI;

        this.extend = function () {
            this.o = $.extend(
                {
                    bgColor : this.$.data('bgcolor') || '#EEEEEE',
                    angleOffset : this.$.data('angleoffset') || 0,
                    angleArc : this.$.data('anglearc') || 360,
                    inline : true
                }, this.o
            );
        };

        this.val = function (v) {
            if (null != v) {
                this.cv = this.o.stopper ? max(min(v, this.o.max), this.o.min) : v;
                this.v = this.cv;
                this.$.val(this.v);
                this._draw();
            } else {
                return this.v;
            }
        };

        this.xy2val = function (x, y) {
            var a, ret;

            a = Math.atan2(
                        x - (this.x + this.w2)
                        , - (y - this.y - this.w2)
                    ) - this.angleOffset;

            if(this.angleArc != this.PI2 && (a < 0) && (a > -0.5)) {
                // if isset angleArc option, set to min if .5 under min
                a = 0;
            } else if (a < 0) {
                a += this.PI2;
            }

            ret = ~~ (0.5 + (a * (this.o.max - this.o.min) / this.angleArc))
                    + this.o.min;

            this.o.stopper
            && (ret = max(min(ret, this.o.max), this.o.min));

            return ret;
        };

        this.listen = function () {
            // bind MouseWheel
            var s = this,
                mw = function (e) {
                            e.preventDefault();
                            var ori = e.originalEvent
                                ,deltaX = ori.detail || ori.wheelDeltaX
                                ,deltaY = ori.detail || ori.wheelDeltaY
                                ,v = parseInt(s.$.val()) + (deltaX>0 || deltaY>0 ? s.o.step : deltaX<0 || deltaY<0 ? -s.o.step : 0);

                            if (
                                s.cH
                                && (s.cH(v) === false)
                            ) return;

                            s.val(v);
                        }
                , kval, to, m = 1, kv = {37:-s.o.step, 38:s.o.step, 39:s.o.step, 40:-s.o.step};

            this.$
                .bind(
                    "keydown"
                    ,function (e) {
                        var kc = e.keyCode;

                        // numpad support
                        if(kc >= 96 && kc <= 105) {
                            kc = e.keyCode = kc - 48;
                        }

                        kval = parseInt(String.fromCharCode(kc));

                        if (isNaN(kval)) {

                            (kc !== 13)         // enter
                            && (kc !== 8)       // bs
                            && (kc !== 9)       // tab
                            && (kc !== 189)     // -
                            && e.preventDefault();

                            // arrows
                            if ($.inArray(kc,[37,38,39,40]) > -1) {
                                e.preventDefault();

                                var v = parseInt(s.$.val()) + kv[kc] * m;

                                s.o.stopper
                                && (v = max(min(v, s.o.max), s.o.min));

                                s.change(v);
                                s._draw();

                                // long time keydown speed-up
                                to = window.setTimeout(
                                    function () { m*=2; }
                                    ,30
                                );
                            }
                        }
                    }
                )
                .bind(
                    "keyup"
                    ,function (e) {
                        if (isNaN(kval)) {
                            if (to) {
                                window.clearTimeout(to);
                                to = null;
                                m = 1;
                                s.val(s.$.val());
                            }
                        } else {
                            // kval postcond
                            (s.$.val() > s.o.max && s.$.val(s.o.max))
                            || (s.$.val() < s.o.min && s.$.val(s.o.min));
                        }

                    }
                );

            this.$c.bind("mousewheel DOMMouseScroll", mw);
            this.$.bind("mousewheel DOMMouseScroll", mw)
        };

        this.init = function () {

            if (
                this.v < this.o.min
                || this.v > this.o.max
            ) this.v = this.o.min;

            this.$.val(this.v);
            this.w2 = this.w / 2;
            this.cursorExt = this.o.cursor / 100;

            this.xy = this.w2 * this.scale;
            this.lineWidth = this.xy * this.o.thickness;
            this.lineCap = this.o.lineCap;
            this.radius = this.xy - this.lineWidth / 2;

            this.o.angleOffset
            && (this.o.angleOffset = isNaN(this.o.angleOffset) ? 0 : this.o.angleOffset);

            this.o.angleArc
            && (this.o.angleArc = isNaN(this.o.angleArc) ? this.PI2 : this.o.angleArc);

            // deg to rad
            this.angleOffset = this.o.angleOffset * Math.PI / 180;
            this.angleArc = this.o.angleArc * Math.PI / 180;

            // compute start and end angles
            this.startAngle = 1.5 * Math.PI + this.angleOffset;
            this.endAngle = 1.5 * Math.PI + this.angleOffset + this.angleArc;

            var s = max(
                            String(Math.abs(this.o.max)).length
                            , String(Math.abs(this.o.min)).length
                            , 2
                            ) + 2;

            this.o.displayInput
                && this.i.css({
                        'width' : ((this.w / 2 + 4) >> 0) + 'px'
                        ,'height' : ((this.w / 3) >> 0) + 'px'
                        ,'position' : 'absolute'
                        ,'vertical-align' : 'middle'
                        ,'margin-top' : ((this.w / 3) >> 0) + 'px'
                        ,'margin-left' : '-' + ((this.w * 3 / 4 + 2) >> 0) + 'px'
                        ,'border' : 0
                        ,'background' : 'none'
                        ,'font' : this.o.fontWeight + ' ' + ((this.w / s) >> 0) + 'px ' + this.o.font
                        ,'text-align' : 'center'
                        ,'color' : this.o.inputColor || this.o.fgColor
                        ,'padding' : '0px'
                        ,'-webkit-appearance': 'none'
                        })
                || this.i.css({
                        'width' : '0px'
                        ,'visibility' : 'hidden'
                        });
        };

        this.change = function (v) {
            this.cv = v;
            this.$.val(v);
        };

        this.angle = function (v) {
            return (v - this.o.min) * this.angleArc / (this.o.max - this.o.min);
        };

        this.draw = function () {

            var c = this.g,                 // context
                a = this.angle(this.cv)    // Angle
                , sat = this.startAngle     // Start angle
                , eat = sat + a             // End angle
                , sa, ea                    // Previous angles
                , r = 1;

            c.lineWidth = this.lineWidth;

            c.lineCap = this.lineCap;

            this.o.cursor
                && (sat = eat - this.cursorExt)
                && (eat = eat + this.cursorExt);

            c.beginPath();
                c.strokeStyle = this.o.bgColor;
                c.arc(this.xy, this.xy, this.radius, this.endAngle, this.startAngle, true);
            c.stroke();

            if (this.o.displayPrevious) {
                ea = this.startAngle + this.angle(this.v);
                sa = this.startAngle;
                this.o.cursor
                    && (sa = ea - this.cursorExt)
                    && (ea = ea + this.cursorExt);

                c.beginPath();
                    c.strokeStyle = this.pColor;
                    c.arc(this.xy, this.xy, this.radius, sa, ea, false);
                c.stroke();
                r = (this.cv == this.v);
            }

            c.beginPath();
                c.strokeStyle = r ? this.o.fgColor : this.fgColor ;
                c.arc(this.xy, this.xy, this.radius, sat, eat, false);
            c.stroke();
        };

        this.cancel = function () {
            this.val(this.v);
        };
    };

    $.fn.dial = $.fn.knob = function (o) {
        return this.each(
            function () {
                var d = new k.Dial();
                d.o = o;
                d.$ = $(this);
                d.run();
            }
        ).parent();
    };

})(jQuery);
/* Minimit Anima 1.4.3 */window.Modernizr=function(a,k,x){function q(a,b){for(var e in a){var n=a[e];if(!~(""+n).indexOf("-")&&c[n]!==x)return"pfx"==b?n:!0}return!1}function u(a,b,c){var e=a.charAt(0).toUpperCase()+a.slice(1),d=(a+" "+p.join(e+" ")+e).split(" ");if("string"===typeof b||"undefined"===typeof b)b=q(d,b);else a:{d=(a+" "+l.join(e+" ")+e).split(" "),a=d;for(var f in a)if(e=b[a[f]],e!==x){b=!1===c?a[f]:"function"===typeof e?e.bind(c||b):e;break a}b=!1}return b}var b={},e=k.documentElement;a=k.createElement("modernizr");
var c=a.style,p=["Webkit","Moz","O","ms"],l=["webkit","moz","o","ms"];a={};var d=[],m=d.slice,C,f=function(a,b,c,d){var l,f,p,m,D=k.createElement("div"),s=k.body,E=s||k.createElement("body");if(parseInt(c,10))for(;c--;)p=k.createElement("div"),p.id=d?d[c]:"modernizr"+(c+1),D.appendChild(p);return l=['&#173;<style id="smodernizr">',a,"</style>"].join(""),D.id="modernizr",(s?D:E).innerHTML+=l,E.appendChild(D),s||(E.style.background="",E.style.overflow="hidden",m=e.style.overflow,e.style.overflow="hidden",
e.appendChild(E)),f=b(D,a),s?D.parentNode.removeChild(D):(E.parentNode.removeChild(E),e.style.overflow=m),!!f},A={}.hasOwnProperty,v;"undefined"===typeof A||"undefined"===typeof A.call?v=function(a,b){return b in a&&"undefined"===typeof a.constructor.prototype[b]}:v=function(a,b){return A.call(a,b)};Function.prototype.bind||(Function.prototype.bind=function(a){var b=this;if("function"!=typeof b)throw new TypeError;var c=m.call(arguments,1),e=function(){if(this instanceof e){var d=function(){};d.prototype=
b.prototype;var d=new d,l=b.apply(d,c.concat(m.call(arguments)));return Object(l)===l?l:d}return b.apply(a,c.concat(m.call(arguments)))};return e});a.csstransforms=function(){return!!u("transform")};a.csstransforms3d=function(){var a=!!u("perspective");return a&&"webkitPerspective"in e.style&&f("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",function(b,c){a=9===b.offsetLeft&&3===b.offsetHeight}),a};a.csstransitions=function(){return u("transition")};
for(var w in a)v(a,w)&&(C=w.toLowerCase(),b[C]=a[w](),d.push((b[C]?"":"no-")+C));b.addTest=function(a,c){if("object"==typeof a)for(var d in a)v(a,d)&&b.addTest(d,a[d]);else{a=a.toLowerCase();if(b[a]!==x)return b;c="function"==typeof c?c():c;"undefined"!=typeof enableClasses&&enableClasses&&(e.className+=" "+(c?"":"no-")+a);b[a]=c}return b};c.cssText="";return a=null,b._version="2.6.2",b._prefixes=" -webkit- -moz- -o- -ms- ".split(" "),b._domPrefixes=l,b._cssomPrefixes=p,b.testProp=function(a){return q([a])},
b.testAllProps=u,b.testStyles=f,b.prefixed=function(a,b,c){return b?u(a,b,c):u(a,"pfx")},b}(this,this.document);
jQuery.extend({bez:function(a){var k="bez_"+$.makeArray(arguments).join("_").replace(".","p");if("function"!=typeof jQuery.easing[k]){var x=function(a,k){var b=[null,null],e=[null,null],c=[null,null],p=function(l,d){return c[d]=3*a[d],e[d]=3*(k[d]-a[d])-c[d],b[d]=1-c[d]-e[d],l*(c[d]+l*(e[d]+l*b[d]))};return function(a){for(var d=a,k=0,q;14>++k;){q=p(d,0)-a;if(0.001>Math.abs(q))break;d-=q/(c[0]+d*(2*e[0]+3*b[0]*d))}return p(d,1)}};jQuery.easing[k]=function(k,u,b,e,c){return e*x([a[0],a[1]],[a[2],a[3]])(u/
c)+b}}return k}});
(function(a,k,x,q,u){function b(b){b=b.split(")");var s=a.trim,c=-1,e=b.length-1,h,d,t=v?new Float32Array(6):[],g=v?new Float32Array(6):[],f=v?new Float32Array(6):[1,0,0,1,0,0];t[0]=t[3]=f[0]=f[3]=1;for(t[1]=t[2]=t[4]=t[5]=0;++c<e;){h=b[c].split("(");d=s(h[0]);h=h[1];g[0]=g[3]=1;g[1]=g[2]=g[4]=g[5]=0;switch(d){case n+"X":g[4]=parseInt(h,10);break;case n+"Y":g[5]=parseInt(h,10);break;case n:h=h.split(",");g[4]=parseInt(h[0],10);g[5]=parseInt(h[1]||0,10);break;case G:h=l(h);g[0]=q.cos(h);g[1]=q.sin(h);
g[2]=-q.sin(h);g[3]=q.cos(h);break;case B+"X":g[0]=+h;break;case B+"Y":g[3]=h;break;case B:h=h.split(",");g[0]=h[0];g[3]=1<h.length?h[1]:h[0];break;case F+"X":g[2]=q.tan(l(h));break;case F+"Y":g[1]=q.tan(l(h));break;case H:h=h.split(","),g[0]=h[0],g[1]=h[1],g[2]=h[2],g[3]=h[3],g[4]=parseInt(h[4],10),g[5]=parseInt(h[5],10)}f[0]=t[0]*g[0]+t[2]*g[1];f[1]=t[1]*g[0]+t[3]*g[1];f[2]=t[0]*g[2]+t[2]*g[3];f[3]=t[1]*g[2]+t[3]*g[3];f[4]=t[0]*g[4]+t[2]*g[5]+t[4];f[5]=t[1]*g[4]+t[3]*g[5]+t[5];t=[f[0],f[1],f[2],
f[3],f[4],f[5]]}return f}function e(a){var b,c,e,h=a[0],d=a[1],f=a[2],g=a[3];h*g-d*f?(b=q.sqrt(h*h+d*d),h/=b,d/=b,e=h*f+d*g,f-=h*e,g-=d*e,c=q.sqrt(f*f+g*g),e/=c,h*(g/c)<d*(f/c)&&(h=-h,d=-d,e=-e,b=-b)):b=c=e=0;return[[n,[+a[4],+a[5]]],[G,q.atan2(d,h)],[F+"X",q.atan(e)],[B,[b,c]]]}function c(c,s){var f={start:[],end:[]},l=-1,h,k,t,g;("none"==c||r.test(c))&&(c="");("none"==s||r.test(s))&&(s="");c&&s&&(!s.indexOf("matrix")&&d(c).join()==d(s.split(")")[0]).join())&&(f.origin=c,c="",s=s.slice(s.indexOf(")")+
1));if(c||s){if(c&&s&&c.replace(/(?:\([^)]*\))|\s/g,"")!=s.replace(/(?:\([^)]*\))|\s/g,""))f.start=e(b(c)),f.end=e(b(s));else for(c&&(c=c.split(")"))&&(h=c.length),s&&(s=s.split(")"))&&(h=s.length);++l<h-1;){c[l]&&(k=c[l].split("("));s[l]&&(t=s[l].split("("));g=a.trim((k||t)[0]);for(var n=f.start,m=p(g,k?k[1]:0),q=void 0;q=m.shift();)n.push(q);n=f.end;for(g=p(g,t?t[1]:0);m=g.shift();)n.push(m)}return f}}function p(a,b){var c=+!a.indexOf(B),f,h=a.replace(/e[XY]/,"e");switch(a){case n+"Y":case B+"Y":b=
[c,b?parseFloat(b):c];break;case n+"X":case n:case B+"X":f=1;case B:b=b?(b=b.split(","))&&[parseFloat(b[0]),parseFloat(1<b.length?b[1]:a==B?f||b[0]:c+"")]:[c,c];break;case F+"X":case F+"Y":case G:b=b?l(b):0;break;case H:return e(b?d(b):[1,0,0,1,0,0])}return[[h,b]]}function l(a){return~a.indexOf("deg")?parseInt(a,10)*(2*q.PI/360):~a.indexOf("grad")?parseInt(a,10)*(q.PI/200):parseFloat(a)}function d(a){a=/([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/.exec(a);return[a[1],a[2],a[3],
a[4],a[5],a[6]]}x=x.createElement("div").style;var m=["OTransform","msTransform","WebkitTransform","MozTransform"],C=m.length,f,A,v="Float32Array"in k,w,I,y=/Matrix([^)]*)/,r=/^\s*matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*(?:,\s*0(?:px)?\s*){2}\)\s*$/,n="translate",G="rotate",B="scale",F="skew",H="matrix";for(;C--;)m[C]in x&&(a.support.transform=f=m[C],a.support.transformOrigin=f+"Origin");f||(a.support.matrixFilter=A=""===x.filter);a.cssNumber.transform=a.cssNumber.transformOrigin=!0;f&&"transform"!=
f?(a.cssProps.transform=f,a.cssProps.transformOrigin=f+"Origin","MozTransform"==f?w={get:function(b,c){return c?a.css(b,f).split("px").join(""):b.style[f]},set:function(a,b){a.style[f]=/matrix\([^)p]*\)/.test(b)?b.replace(/matrix((?:[^,]*,){4})([^,]*),([^)]*)/,H+"$1$2px,$3px"):b}}:/^1\.[0-5](?:\.|$)/.test(a.fn.jquery)&&(w={get:function(b,c){return c?a.css(b,f.replace(/^ms/,"Ms")):b.style[f]}})):A&&(w={get:function(b,c,e){var d=c&&b.currentStyle?b.currentStyle:b.style;d&&y.test(d.filter)?(c=RegExp.$1.split(","),
c=[c[0].split("=")[1],c[2].split("=")[1],c[1].split("=")[1],c[3].split("=")[1]]):c=[1,0,0,1];a.cssHooks.transformOrigin?(b=a._data(b,"transformTranslate",u),c[4]=b?b[0]:0,c[5]=b?b[1]:0):(c[4]=d?parseInt(d.left,10)||0:0,c[5]=d?parseInt(d.top,10)||0:0);return e?c:H+"("+c+")"},set:function(c,d,e){var f=c.style,h,l;e||(f.zoom=1);d=b(d);e=["Matrix(M11="+d[0],"M12="+d[2],"M21="+d[1],"M22="+d[3],"SizingMethod='auto expand'"].join();l=(h=c.currentStyle)&&h.filter||f.filter||"";f.filter=y.test(l)?l.replace(y,
e):l+" progid:DXImageTransform.Microsoft."+e+")";if(a.cssHooks.transformOrigin)a.cssHooks.transformOrigin.set(c,d);else{if(h=a.transform.centerOrigin)f["margin"==h?"marginLeft":"left"]=-(c.offsetWidth/2)+c.clientWidth/2+"px",f["margin"==h?"marginTop":"top"]=-(c.offsetHeight/2)+c.clientHeight/2+"px";f.left=d[4]+"px";f.top=d[5]+"px"}}});w&&(a.cssHooks.transform=w);I=w&&w.get||a.css;a.fx.step.transform=function(b){var d=b.elem,e=b.start,l=b.end,h=b.pos,k="",p,g,m,r;e&&"string"!==typeof e||(e||(e=I(d,
f)),A&&(d.style.zoom=1),l=l.split("+=").join(e),a.extend(b,c(e,l)),e=b.start,l=b.end);for(p=e.length;p--;)switch(g=e[p],m=l[p],r=0,g[0]){case n:r="px";case B:r||(r="");k=g[0]+"("+q.round(1E5*(g[1][0]+(m[1][0]-g[1][0])*h))/1E5+r+","+q.round(1E5*(g[1][1]+(m[1][1]-g[1][1])*h))/1E5+r+")"+k;break;case F+"X":case F+"Y":case G:k=g[0]+"("+q.round(1E5*(g[1]+(m[1]-g[1])*h))/1E5+"rad)"+k}b.origin&&(k=b.origin+k);w&&w.set?w.set(d,k,1):d.style[f]=k};a.transform={centerOrigin:"margin"}})(jQuery,window,document,
Math);
(function(a){function k(a){return"undefined"!=typeof a}a.anima={partialSupport:null,noSupport:null,uniquePrefixIndex:0,transformProps:[],transformProps1:"x y z translateX translateY translateZ translate translate3d".split(" "),transformProps2:"scale scaleX scaleY scaleZ skew skewX skewY rotate rotateX rotateY rotateZ perspective".split(" "),cssEase:{linear:".25,.25,.75,.75",ease:".25,.1,.25,1",easeIn:".42,0,1,1",easeOut:"0,0,.58,1",easeInOut:".42,0,.58,10",easeInQuad:".55,.085,.68,.53",easeInCubic:".55,.055,.675,.19",easeInQuart:".895,.03,.685,.22",
easeInQuint:".755,.05,.855,.06",easeInSine:".470,0,.745,.715",easeInExpo:".95,.05,.795,.035",easeInCirc:".6,.04,.98,.335",easeInBack:".6,-0.28,.735,.045",easeOutQuad:".25,.46,.45,.94",easeOutCubic:".215,.61,.355,1",easeOutQuart:".165,.84,.44,1",easeOutQuint:".23,1,.32,1",easeOutSine:".39,.575,.565,1",easeOutExpo:".19,1,.22,1",easeOutCirc:".075,.82,.165,1",easeOutBack:".175,.885,.32,1.275",easeInOutQuad:".455,.03,.515,.955",easeInOutCubic:".645,.045,.355,1",easeInOutQuart:".77,0,.175,1",easeInOutQuint:".86,0,.07,10",
easeInOutSine:".445,.05,.55,.95",easeInOutExpo:"1,0,0,1",easeInOutCirc:".785,.135,.15,.86",easeInOutBack:".68,-0.55,.265,1.55"}};a.anima.transformProps=a.anima.transformProps1.concat(a.anima.transformProps2);a.anima.unit=function(a,e){return"string"!==typeof a||a.match(/^[\-0-9\.]+$/)?""+a+e:a};var x=function(a){return a?a.replace(/([A-Z])/g,function(a,b){return"-"+b.toLowerCase()}).replace(/^ms-/,"-ms-"):!1}(Modernizr.prefixed("transform"));Modernizr.prefixed("transition");var q=window.Modernizr.csstransforms3d,
u=window.Modernizr.csstransitions;a.anima.noSupport=!window.Modernizr.csstransforms;a.anima.partialSupport=!q||!u;a.fn.anima2d=function(b,e,c,k){return a.anima.partialSupport?a(this).anima(b,e,c,k,"anima2d"):a(this)};a.fn.anima3d=function(b,e,c,k){return a.anima.partialSupport?a(this):a(this).anima(b,e,c,k,"anima3d")};a.fn.anima=function(b,e,c,p,l){"object"===typeof e&&(p=e,e=void 0);"object"===typeof c&&(p=c,c=void 0);k(l)||(l="anima");k(e)||(e=0);k(c)||(c="easeOut");k(p)||(p={});k(p.skipInstant)||
(p.skipInstant=!1);a.anima.cssEase[c]&&(c=a.anima.cssEase[c]);return a(this).each(function(){var d=a(this);d.data("uniquePrefix")||d.data("uniquePrefix","animaPrefix"+ ++a.anima.uniquePrefixIndex);a.anima[d.data("uniquePrefix")]||(a.anima[d.data("uniquePrefix")]={});a.anima.noSupport?d.goAnima(b,e,c,p,l):d.queue(function(a){d.goAnima(b,e,c,p,l);0==e&&d.stopAnima()})})};a.fn.goAnima=function(b,e,c,p,l){var d=this,m=a(this),q=a.bez(c.split(",")),f="cubic-bezier("+c+")",A=e/1E3;if(!a.anima.noSupport){var v=
[];c=[];var w=a.anima.transformProps,u=a.anima.transformProps1,y=a.anima.transformProps2;if(!a.anima.partialSupport&&"anima2d"!=l){l=a.anima[m.data("uniquePrefix")];for(i=0;i<u.length;i++){var r=u[i];k(b[r])&&(-1==r.indexOf("translate")&&(r="translate"+r.toUpperCase()),v.push(r+"("+a.anima.unit(b[u[i]],"px")+")"))}for(i=0;i<y.length;i++)k(b[y[i]])&&(r=y[i],-1==r.indexOf("scale")?v.push(r+"("+a.anima.unit(b[y[i]],"deg")+")"):v.push(r+"("+b[y[i]]+")"));0<v.length&&(m.css(x,v.join(" ")),l[x]=!0,c.push(x+
" "+A+"s "+f));for(var n in b)-1==a.inArray(n,w)&&c.push(n+" "+A+"s "+f);if(m.data("transitions")){f=m.data("transitions");A=[];for(i=0;i<f.length;i++)for(v=f[i].slice(0,f[i].indexOf(" ")),z=0;z<c.length&&(u=c[z].slice(0,c[z].indexOf(" ")),v!=u);z++)z==c.length-1&&A.push(f[i]);c=c.concat(A)}m.data("transitions",c);0<c.length&&m.css("transition",c.join(", "));for(n in b)-1==a.inArray(n,w)&&(m.css(n,b[n]),l[n]=!0)}else if(a.anima.partialSupport&&"anima3d"!=l){for(i=0;i<u.length;i++)r=u[i],k(b[r])&&
-1==r.toLowerCase().indexOf("z")&&(-1==r.indexOf("translate")&&(r="translate"+r.toUpperCase()),v.push(r+"("+a.anima.unit(b[u[i]],"px")+")"));for(i=0;i<y.length;i++)k(b[y[i]])&&(r=y[i],-1==r.indexOf("scale")?v.push(r+"("+a.anima.unit(b[y[i]],"deg")+")"):v.push(r+"("+b[y[i]]+")"));0<v.length&&m.animate({transform:v.join(" ")},{queue:!1,duration:e,specialEasing:{transform:q}});for(n in b)-1==a.inArray(n,w)&&(c=n.replace(/-([a-z])/g,function(a){return a[1].toUpperCase()}),l={},l[c]=b[n],f={},f[c]=q,m.animate(l,
{queue:!1,duration:e,specialEasing:f}))}m.animate({fake:0},{queue:!1,duration:e,specialEasing:{fake:q},complete:function(){k(p.complete)&&p.complete.apply(d);m.dequeue()}})}else if("anima3d"!=l&&!p.skipInstant){k(b.x)&&m.css("marginLeft",b.x);k(b.y)&&m.css("marginTop",b.x);for(n in b)-1==a.inArray(n,w)&&m.css(n,b[n]);k(p.complete)&&p.complete.apply(d)}};a.fn.delayAnima=function(b){return a(this).each(function(){a.anima.noSupport||a(this).delay(b)})};a.fn.clearAnima=function(){return a(this).each(function(){a.anima.noSupport||
a(this).clearQueue()})};a.fn.stopAnima=function(b,e){k(b)||(b=!1);k(e)||(e=!1);return a(this).each(function(){if(!a.anima.noSupport){var c=a(this);if(!a.anima.partialSupport){c.data("transitions","");if(e)c.css("transition","none");else{var k=a.anima[c.data("uniquePrefix")];if(k)for(var l in k)c.css(l,c.css(l));c.css("transition","all 0s")}a.anima[c.data("uniquePrefix")]={}}c.stop(b,e)}})}})(jQuery);
// Generated by CoffeeScript 1.6.3
(function() {
  'use strict';
  var $, OriDomi, addStyle, anchorList, anchorListH, anchorListV, baseName, capitalize, cloneEl, createEl, css, defaults, defer, elClasses, getGradient, hideEl, isSupported, k, noOp, prefixList, prep, showEl, styleBuffer, supportWarning, testEl, testProp, v, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  isSupported = true;

  supportWarning = function(prop) {
    if (typeof console !== "undefined" && console !== null) {
      console.warn("OriDomi: Missing support for `" + prop + "`.");
    }
    return isSupported = false;
  };

  testProp = function(prop) {
    var full, prefix, _i, _len;
    for (_i = 0, _len = prefixList.length; _i < _len; _i++) {
      prefix = prefixList[_i];
      if (testEl.style[(full = prefix + capitalize(prop))] != null) {
        return full;
      }
    }
    if (testEl.style[prop] != null) {
      return prop;
    }
    return false;
  };

  addStyle = function(selector, rules) {
    var prop, style, val;
    style = "." + selector + "{";
    for (prop in rules) {
      val = rules[prop];
      if (prop in css) {
        prop = css[prop];
        if (prop.match(/^(webkit|moz|ms)/i)) {
          prop = '-' + prop;
        }
      }
      style += "" + (prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()) + ":" + val + ";";
    }
    return styleBuffer += style + '}';
  };

  getGradient = function(anchor) {
    return "" + css.gradientProp + "(" + anchor + ", rgba(0, 0, 0, .5) 0%, rgba(255, 255, 255, .35) 100%)";
  };

  capitalize = function(s) {
    return s[0].toUpperCase() + s.slice(1);
  };

  createEl = function(className) {
    var el;
    el = document.createElement('div');
    el.className = elClasses[className];
    return el;
  };

  cloneEl = function(parent, deep, className) {
    var el;
    el = parent.cloneNode(deep);
    el.classList.add(elClasses[className]);
    return el;
  };

  hideEl = function(el) {
    return el.style[css.transform] = 'translate3d(-99999px, 0, 0)';
  };

  showEl = function(el) {
    return el.style[css.transform] = 'translate3d(0, 0, 0)';
  };

  prep = function(fn) {
    return function() {
      var a0, a1, a2, anchor, angle, opt;
      if (this._touchStarted) {
        return fn.apply(this, arguments);
      } else {
        a0 = arguments[0], a1 = arguments[1], a2 = arguments[2];
        opt = {};
        angle = anchor = null;
        switch (fn.length) {
          case 1:
            opt.callback = a0;
            if (!this.isFoldedUp) {
              return typeof opt.callback === "function" ? opt.callback() : void 0;
            }
            break;
          case 2:
            if (typeof a0 === 'function') {
              opt.callback = a0;
            } else {
              anchor = a0;
              opt.callback = a1;
            }
            break;
          case 3:
            angle = a0;
            if (arguments.length === 2) {
              if (typeof a1 === 'object') {
                opt = a1;
              } else if (typeof a1 === 'function') {
                opt.callback = a1;
              } else {
                anchor = a1;
              }
            } else if (arguments.length === 3) {
              anchor = a1;
              if (typeof a2 === 'object') {
                opt = a2;
              } else if (typeof a2 === 'function') {
                opt.callback = a2;
              }
            }
        }
        if (angle == null) {
          angle = this._lastOp.angle || 0;
        }
        anchor || (anchor = this._lastOp.anchor);
        this._queue.push([fn, this._normalizeAngle(angle), this._getLonghandAnchor(anchor), opt]);
        this._step();
        return this;
      }
    };
  };

  defer = function(fn) {
    return setTimeout(fn, 0);
  };

  noOp = function() {};

  $ = ((_ref = window.jQuery || window.$) != null ? _ref.data : void 0) ? window.$ : null;

  anchorList = ['left', 'right', 'top', 'bottom'];

  anchorListV = anchorList.slice(0, 2);

  anchorListH = anchorList.slice(2);

  testEl = document.createElement('div');

  styleBuffer = '';

  prefixList = ['Webkit', 'Moz', 'ms'];

  baseName = 'oridomi';

  elClasses = {
    active: 'active',
    clone: 'clone',
    holder: 'holder',
    stage: 'stage',
    stageLeft: 'stage-left',
    stageRight: 'stage-right',
    stageTop: 'stage-top',
    stageBottom: 'stage-bottom',
    content: 'content',
    mask: 'mask',
    maskH: 'mask-h',
    maskV: 'mask-v',
    panel: 'panel',
    panelH: 'panel-h',
    panelV: 'panel-v',
    shader: 'shader',
    shaderLeft: 'shader-left',
    shaderRight: 'shader-right',
    shaderTop: 'shader-top',
    shaderBottom: 'shader-bottom'
  };

  for (k in elClasses) {
    v = elClasses[k];
    elClasses[k] = "" + baseName + "-" + v;
  }

  css = new function() {
    var key, _i, _len, _ref1;
    _ref1 = ['transform', 'transformOrigin', 'transformStyle', 'transitionProperty', 'transitionDuration', 'transitionDelay', 'transitionTimingFunction', 'perspective', 'perspectiveOrigin', 'backfaceVisibility', 'boxSizing', 'mask'];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      key = _ref1[_i];
      this[key] = key;
    }
    return this;
  };

  (function() {
    var anchor, key, p3d, styleEl, value, _i, _len, _ref1, _ref2;
    for (key in css) {
      value = css[key];
      css[key] = testProp(value);
      if (!css[key]) {
        return supportWarning(value);
      }
    }
    p3d = 'preserve-3d';
    testEl.style[css.transformStyle] = p3d;
    if (testEl.style[css.transformStyle] !== p3d) {
      return supportWarning(p3d);
    }
    css.gradientProp = (function() {
      var hyphenated, prefix, _i, _len;
      for (_i = 0, _len = prefixList.length; _i < _len; _i++) {
        prefix = prefixList[_i];
        hyphenated = "-" + (prefix.toLowerCase()) + "-linear-gradient";
        testEl.style.backgroundImage = "" + hyphenated + "(left, #000, #fff)";
        if (testEl.style.backgroundImage.indexOf('gradient') !== -1) {
          return hyphenated;
        }
      }
      return 'linear-gradient';
    })();
    _ref1 = (function() {
      var grabValue, plainGrab, prefix, _i, _len;
      for (_i = 0, _len = prefixList.length; _i < _len; _i++) {
        prefix = prefixList[_i];
        plainGrab = 'grab';
        testEl.style.cursor = (grabValue = "-" + (prefix.toLowerCase()) + "-" + plainGrab);
        if (testEl.style.cursor === grabValue) {
          return [grabValue, "-" + (prefix.toLowerCase()) + "-grabbing"];
        }
      }
      testEl.style.cursor = plainGrab;
      if (testEl.style.cursor === plainGrab) {
        return [plainGrab, 'grabbing'];
      } else {
        return ['move', 'move'];
      }
    })(), css.grab = _ref1[0], css.grabbing = _ref1[1];
    css.transformProp = (function() {
      var prefix;
      if (prefix = css.transform.match(/(\w+)Transform/i)) {
        return "-" + (prefix[1].toLowerCase()) + "-transform";
      } else {
        return 'transform';
      }
    })();
    css.transitionEnd = (function() {
      switch (css.transitionProperty.toLowerCase()) {
        case 'transitionproperty':
          return 'transitionEnd';
        case 'webkittransitionproperty':
          return 'webkitTransitionEnd';
        case 'moztransitionproperty':
          return 'transitionend';
        case 'mstransitionproperty':
          return 'msTransitionEnd';
      }
    })();
    addStyle(elClasses.active, {
      backgroundColor: 'transparent !important',
      backgroundImage: 'none !important',
      boxSizing: 'border-box !important',
      border: 'none !important',
      outline: 'none !important',
      padding: '0 !important',
      position: 'relative',
      transformStyle: p3d + ' !important',
      mask: 'none !important'
    });
    addStyle(elClasses.clone, {
      margin: '0 !important',
      boxSizing: 'border-box !important',
      overflow: 'hidden !important',
      display: 'block !important'
    });
    addStyle(elClasses.holder, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: '0',
      transformStyle: p3d
    });
    addStyle(elClasses.stage, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      transform: 'translate3d(-9999px, 0, 0)',
      margin: '0',
      padding: '0',
      transformStyle: p3d
    });
    _ref2 = {
      Left: '0% 50%',
      Right: '100% 50%',
      Top: '50% 0%',
      Bottom: '50% 100%'
    };
    for (k in _ref2) {
      v = _ref2[k];
      addStyle(elClasses['stage' + k], {
        perspectiveOrigin: v
      });
    }
    addStyle(elClasses.shader, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      opacity: '0',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      transitionProperty: 'opacity'
    });
    for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
      anchor = anchorList[_i];
      addStyle(elClasses['shader' + capitalize(anchor)], {
        background: getGradient(anchor)
      });
    }
    addStyle(elClasses.content, {
      margin: '0 !important',
      position: 'relative !important',
      float: 'none !important',
      boxSizing: 'border-box !important',
      overflow: 'hidden !important'
    });
    addStyle(elClasses.mask, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      overflow: 'hidden',
      transform: 'translate3d(0, 0, 0)'
    });
    addStyle(elClasses.panel, {
      width: '100%',
      height: '100%',
      padding: '0',
      position: 'relative',
      transitionProperty: css.transformProp,
      transformOrigin: 'left',
      transformStyle: p3d
    });
    addStyle(elClasses.panelH, {
      transformOrigin: 'top'
    });
    addStyle("" + elClasses.stageRight + " ." + elClasses.panel, {
      transformOrigin: 'right'
    });
    addStyle("" + elClasses.stageBottom + " ." + elClasses.panel, {
      transformOrigin: 'bottom'
    });
    styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    if (styleEl.styleSheet) {
      styleEl.styleSheet.cssText = styleBuffer;
    } else {
      styleEl.appendChild(document.createTextNode(styleBuffer));
    }
    return document.head.appendChild(styleEl);
  })();

  defaults = {
    vPanels: 3,
    hPanels: 3,
    perspective: 1000,
    shading: 'hard',
    speed: 700,
    maxAngle: 90,
    ripple: 0,
    oriDomiClass: 'oridomi',
    shadingIntensity: 1,
    easingMethod: '',
    touchEnabled: true,
    touchSensitivity: .25,
    touchStartCallback: noOp,
    touchMoveCallback: noOp,
    touchEndCallback: noOp
  };

  OriDomi = (function() {
    function OriDomi(el, options) {
      var a, anchor, anchorSet, axis, classSuffix, content, contentHolder, count, i, mask, maskProto, metric, n, panel, panelN, panelProto, percent, proto, shaderProto, shaderProtos, side, stageProto, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _p, _q, _ref1;
      this.el = el;
      if (options == null) {
        options = {};
      }
      this._onMouseOut = __bind(this._onMouseOut, this);
      this._onTouchLeave = __bind(this._onTouchLeave, this);
      this._onTouchEnd = __bind(this._onTouchEnd, this);
      this._onTouchMove = __bind(this._onTouchMove, this);
      this._onTouchStart = __bind(this._onTouchStart, this);
      this._stageReset = __bind(this._stageReset, this);
      this._conclude = __bind(this._conclude, this);
      this._onTransitionEnd = __bind(this._onTransitionEnd, this);
      this._step = __bind(this._step, this);
      if (!isSupported) {
        return;
      }
      if (!(this instanceof OriDomi)) {
        return (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(OriDomi, arguments, function(){});
      }
      if (typeof this.el === 'string') {
        this.el = document.querySelector(this.el);
      }
      if (!(this.el && this.el.nodeType === 1)) {
        if (typeof console !== "undefined" && console !== null) {
          console.warn('OriDomi: First argument must be a DOM element');
        }
        return;
      }
      this._config = new function() {
        for (k in defaults) {
          v = defaults[k];
          if (options[k] != null) {
            this[k] = options[k];
          } else {
            this[k] = v;
          }
        }
        return this;
      };
      this._config.ripple = Number(this._config.ripple);
      this._queue = [];
      this._panels = {};
      this._stages = {};
      this._lastOp = {
        anchor: anchorList[0]
      };
      this._shading = this._config.shading;
      if (this._shading === true) {
        this._shading = 'hard';
      }
      if (this._shading) {
        this._shaders = {};
        shaderProtos = {};
        shaderProto = createEl('shader');
        shaderProto.style[css.transitionDuration] = this._config.speed + 'ms';
        shaderProto.style[css.transitionTimingFunction] = this._config.easingMethod;
      }
      stageProto = createEl('stage');
      stageProto.style[css.perspective] = this._config.perspective + 'px';
      for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
        anchor = anchorList[_i];
        this._panels[anchor] = [];
        this._stages[anchor] = cloneEl(stageProto, false, 'stage' + capitalize(anchor));
        if (this._shading) {
          this._shaders[anchor] = {};
          if (__indexOf.call(anchorListV, anchor) >= 0) {
            for (_j = 0, _len1 = anchorListV.length; _j < _len1; _j++) {
              side = anchorListV[_j];
              this._shaders[anchor][side] = [];
            }
          } else {
            for (_k = 0, _len2 = anchorListH.length; _k < _len2; _k++) {
              side = anchorListH[_k];
              this._shaders[anchor][side] = [];
            }
          }
          shaderProtos[anchor] = cloneEl(shaderProto, false, 'shader' + capitalize(anchor));
        }
      }
      contentHolder = cloneEl(this.el, true, 'content');
      maskProto = createEl('mask');
      maskProto.appendChild(contentHolder);
      panelProto = createEl('panel');
      panelProto.style[css.transitionDuration] = this._config.speed + 'ms';
      panelProto.style[css.transitionTimingFunction] = this._config.easingMethod;
      _ref1 = ['x', 'y'];
      for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
        axis = _ref1[_l];
        if (axis === 'x') {
          anchorSet = anchorListV;
          count = this._config.vPanels;
          metric = 'width';
          classSuffix = 'V';
        } else {
          anchorSet = anchorListH;
          count = this._config.hPanels;
          metric = 'height';
          classSuffix = 'H';
        }
        percent = 100 / count;
        mask = cloneEl(maskProto, true, 'mask' + classSuffix);
        content = mask.children[0];
        content.style.width = content.style.height = '100%';
        content.style[metric] = content.style['max' + capitalize(metric)] = count * 100 + '%';
        if (this._shading) {
          for (_m = 0, _len4 = anchorSet.length; _m < _len4; _m++) {
            anchor = anchorSet[_m];
            mask.appendChild(shaderProtos[anchor]);
          }
        }
        proto = cloneEl(panelProto, false, 'panel' + classSuffix);
        proto.appendChild(mask);
        for (n = _n = 0, _len5 = anchorSet.length; _n < _len5; n = ++_n) {
          anchor = anchorSet[n];
          for (panelN = _o = 0; 0 <= count ? _o < count : _o > count; panelN = 0 <= count ? ++_o : --_o) {
            panel = proto.cloneNode(true);
            if (panelN === 0) {
              panel.style[metric] = percent + '%';
            }
            content = panel.children[0].children[0];
            if (n === 0) {
              content.style[anchor] = -panelN * 100 + '%';
              if (panelN === 0) {
                panel.style[anchor] = '0';
              } else {
                panel.style[anchor] = '100%';
              }
            } else {
              content.style[anchorSet[0]] = (count - panelN - 1) * -100 + '%';
              panel.style[css.origin] = anchor;
              if (panelN === 0) {
                panel.style[anchorSet[0]] = 100 - percent + '%';
              } else {
                panel.style[anchorSet[0]] = '-100%';
              }
            }
            if (this._shading) {
              for (i = _p = 0, _len6 = anchorSet.length; _p < _len6; i = ++_p) {
                a = anchorSet[i];
                this._shaders[anchor][a][panelN] = panel.children[0].children[i + 1];
              }
            }
            this._panels[anchor][panelN] = panel;
            if (panelN !== 0) {
              this._panels[anchor][panelN - 1].appendChild(panel);
            }
          }
          this._stages[anchor].appendChild(this._panels[anchor][0]);
        }
      }
      this._stageHolder = createEl('holder');
      for (_q = 0, _len7 = anchorList.length; _q < _len7; _q++) {
        anchor = anchorList[_q];
        this._stageHolder.appendChild(this._stages[anchor]);
      }
      this.el.classList.add(elClasses.active);
      showEl(this._stages.left);
      this._cloneEl = cloneEl(this.el, true, 'clone');
      this._cloneEl.classList.remove(elClasses.active);
      hideEl(this._cloneEl);
      this.el.innerHTML = '';
      this.el.appendChild(this._cloneEl);
      this.el.appendChild(this._stageHolder);
      this.el.parentNode.style[css.transformStyle] = 'preserve-3d';
      this.accordion(0);
      if (this._config.ripple) {
        this.setRipple(this._config.ripple);
      }
      if (this._config.touchEnabled) {
        this.enableTouch();
      }
    }

    OriDomi.prototype._step = function() {
      var anchor, angle, fn, next, options, _ref1,
        _this = this;
      if (this._inTrans || !this._queue.length) {
        return;
      }
      this._inTrans = true;
      _ref1 = this._queue.shift(), fn = _ref1[0], angle = _ref1[1], anchor = _ref1[2], options = _ref1[3];
      if (this.isFrozen) {
        this.unfreeze();
      }
      next = function() {
        var args;
        _this._setCallback({
          angle: angle,
          anchor: anchor,
          options: options,
          fn: fn
        });
        args = [angle, anchor, options];
        if (fn.length < 3) {
          args.shift();
        }
        return fn.apply(_this, args);
      };
      if (this.isFoldedUp) {
        if (fn.length === 2) {
          return next();
        } else {
          return this._unfold(next);
        }
      } else if (anchor !== this._lastOp.anchor) {
        return this._stageReset(anchor, next);
      } else {
        return next();
      }
    };

    OriDomi.prototype._isIdenticalOperation = function(op) {
      var key, _i, _len, _ref1, _ref2;
      if (!this._lastOp.fn) {
        return true;
      }
      if (this._lastOp.reset) {
        return false;
      }
      _ref1 = ['angle', 'anchor', 'fn'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        key = _ref1[_i];
        if (this._lastOp[key] !== op[key]) {
          return false;
        }
      }
      _ref2 = op.options;
      for (k in _ref2) {
        v = _ref2[k];
        if (v !== this._lastOp.options[k] && k !== 'callback') {
          return false;
        }
      }
      return true;
    };

    OriDomi.prototype._setCallback = function(operation) {
      if (this._isIdenticalOperation(operation)) {
        this._conclude(operation.options.callback);
      } else {
        this._panels[this._lastOp.anchor][0].addEventListener(css.transitionEnd, this._onTransitionEnd, false);
      }
      return (this._lastOp = operation).reset = false;
    };

    OriDomi.prototype._onTransitionEnd = function(e) {
      e.currentTarget.removeEventListener(css.transitionEnd, this._onTransitionEnd, false);
      return this._conclude(this._lastOp.options.callback, e);
    };

    OriDomi.prototype._conclude = function(cb, event) {
      var _this = this;
      return defer(function() {
        _this._inTrans = false;
        _this._step();
        return typeof cb === "function" ? cb(event, _this) : void 0;
      });
    };

    OriDomi.prototype._transformPanel = function(el, angle, anchor, fracture) {
      var translate, x, y, z;
      x = y = z = 0;
      switch (anchor) {
        case 'left':
          y = angle;
          translate = 'X(-1';
          break;
        case 'right':
          y = -angle;
          translate = 'X(1';
          break;
        case 'top':
          x = -angle;
          translate = 'Y(-1';
          break;
        case 'bottom':
          x = angle;
          translate = 'Y(1';
      }
      if (fracture) {
        x = y = z = angle;
      }
      return el.style[css.transform] = "rotateX(" + x + "deg)\nrotateY(" + y + "deg)\nrotateZ(" + z + "deg)\ntranslate" + translate + "px)";
    };

    OriDomi.prototype._normalizeAngle = function(angle) {
      var max;
      angle = parseFloat(angle, 10);
      max = this._config.maxAngle;
      if (isNaN(angle)) {
        return 0;
      } else if (angle > max) {
        return max;
      } else if (angle < -max) {
        return -max;
      } else {
        return angle;
      }
    };

    OriDomi.prototype._setTrans = function(duration, delay, anchor) {
      var _this = this;
      if (anchor == null) {
        anchor = this._lastOp.anchor;
      }
      return this._iterate(anchor, function(panel, i, len) {
        return _this._setPanelTrans.apply(_this, [anchor].concat(__slice.call(arguments), [duration], [delay]));
      });
    };

    OriDomi.prototype._setPanelTrans = function(anchor, panel, i, len, duration, delay) {
      var delayMs, shader, side, _i, _len, _ref1,
        _this = this;
      delayMs = (function() {
        switch (delay) {
          case 0:
            return 0;
          case 1:
            return _this._config.speed / len * i;
          case 2:
            return _this._config.speed / len * (len - i - 1);
        }
      })();
      panel.style[css.transitionDuration] = duration + 'ms';
      panel.style[css.transitionDelay] = delayMs + 'ms';
      if (this._shading) {
        _ref1 = (__indexOf.call(anchorListV, anchor) >= 0 ? anchorListV : anchorListH);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          side = _ref1[_i];
          shader = this._shaders[anchor][side][i];
          shader.style[css.transitionDuration] = duration + 'ms';
          shader.style[css.transitionDelay] = delayMs + 'ms';
        }
      }
      return delayMs;
    };

    OriDomi.prototype._setShader = function(n, anchor, angle) {
      var a, abs, b, opacity;
      abs = Math.abs(angle);
      opacity = abs / 90 * this._config.shadingIntensity;
      if (this._shading === 'hard') {
        opacity *= .15;
        if (this._lastOp.angle < 0) {
          angle = abs;
        } else {
          angle = -abs;
        }
      } else {
        opacity *= .4;
      }
      if (__indexOf.call(anchorListV, anchor) >= 0) {
        if (angle < 0) {
          a = opacity;
          b = 0;
        } else {
          a = 0;
          b = opacity;
        }
        this._shaders[anchor].left[n].style.opacity = a;
        return this._shaders[anchor].right[n].style.opacity = b;
      } else {
        if (angle < 0) {
          a = 0;
          b = opacity;
        } else {
          a = opacity;
          b = 0;
        }
        this._shaders[anchor].top[n].style.opacity = a;
        return this._shaders[anchor].bottom[n].style.opacity = b;
      }
    };

    OriDomi.prototype._showStage = function(anchor) {
      var _this = this;
      if (anchor !== this._lastOp.anchor) {
        hideEl(this._stages[this._lastOp.anchor]);
        this._lastOp.anchor = anchor;
        this._lastOp.reset = true;
        return this._stages[anchor].style[css.transform] = 'translate3d(' + (function() {
          switch (anchor) {
            case 'left':
              return '0, 0, 0)';
            case 'right':
              return "-" + (_this._config.vPanels * 1) + "px, 0, 0)";
            case 'top':
              return '0, 0, 0)';
            case 'bottom':
              return "0, -" + ((_this._config.hPanels + 2) * 1) + "px, 0)";
          }
        })();
      }
    };

    OriDomi.prototype._stageReset = function(anchor, cb) {
      var fn,
        _this = this;
      fn = function(e) {
        if (e) {
          e.currentTarget.removeEventListener(css.transitionEnd, fn, false);
        }
        _this._showStage(anchor);
        return defer(cb);
      };
      if (this._lastOp.angle === 0) {
        return fn();
      }
      this._panels[this._lastOp.anchor][0].addEventListener(css.transitionEnd, fn, false);
      return this._iterate(this._lastOp.anchor, function(panel, i) {
        _this._transformPanel(panel, 0, _this._lastOp.anchor);
        if (_this._shading) {
          return _this._setShader(i, _this._lastOp.anchor, 0);
        }
      });
    };

    OriDomi.prototype._getLonghandAnchor = function(shorthand) {
      switch (shorthand.toString()) {
        case 'left':
        case 'l':
        case '4':
          return 'left';
        case 'right':
        case 'r':
        case '2':
          return 'right';
        case 'top':
        case 't':
        case '1':
          return 'top';
        case 'bottom':
        case 'b':
        case '3':
          return 'bottom';
        default:
          return 'left';
      }
    };

    OriDomi.prototype._setCursor = function(bool) {
      if (bool == null) {
        bool = this._touchEnabled;
      }
      if (bool) {
        return this.el.style.cursor = css.grab;
      } else {
        return this.el.style.cursor = 'default';
      }
    };

    OriDomi.prototype._setTouch = function(toggle) {
      var eString, eventPair, eventPairs, listenFn, mouseLeaveSupport, _i, _j, _len, _len1;
      if (toggle) {
        if (this._touchEnabled) {
          return this;
        }
        listenFn = 'addEventListener';
      } else {
        if (!this._touchEnabled) {
          return this;
        }
        listenFn = 'removeEventListener';
      }
      this._touchEnabled = toggle;
      this._setCursor();
      eventPairs = [['TouchStart', 'MouseDown'], ['TouchEnd', 'MouseUp'], ['TouchMove', 'MouseMove'], ['TouchLeave', 'MouseLeave']];
      mouseLeaveSupport = 'onmouseleave' in window;
      for (_i = 0, _len = eventPairs.length; _i < _len; _i++) {
        eventPair = eventPairs[_i];
        for (_j = 0, _len1 = eventPair.length; _j < _len1; _j++) {
          eString = eventPair[_j];
          if (!(eString === 'TouchLeave' && !mouseLeaveSupport)) {
            this.el[listenFn](eString.toLowerCase(), this['_on' + eventPair[0]], false);
          } else {
            this.el[listenFn]('mouseout', this._onMouseOut, false);
            break;
          }
        }
      }
      return this;
    };

    OriDomi.prototype._onTouchStart = function(e) {
      var axis1, _ref1;
      if (!this._touchEnabled || this.isFoldedUp) {
        return;
      }
      e.preventDefault();
      this.emptyQueue();
      this._touchStarted = true;
      this.el.style.cursor = css.grabbing;
      this._setTrans(0, 0);
      this._touchAxis = (_ref1 = this._lastOp.anchor, __indexOf.call(anchorListV, _ref1) >= 0) ? 'x' : 'y';
      this["_" + this._touchAxis + "Last"] = this._lastOp.angle;
      axis1 = "_" + this._touchAxis + "1";
      if (e.type === 'mousedown') {
        this[axis1] = e["page" + (this._touchAxis.toUpperCase())];
      } else {
        this[axis1] = e.targetTouches[0]["page" + (this._touchAxis.toUpperCase())];
      }
      return this._config.touchStartCallback(this[axis1], e);
    };

    OriDomi.prototype._onTouchMove = function(e) {
      var current, delta, distance;
      if (!(this._touchEnabled && this._touchStarted)) {
        return;
      }
      e.preventDefault();
      if (e.type === 'mousemove') {
        current = e["page" + (this._touchAxis.toUpperCase())];
      } else {
        current = e.targetTouches[0]["page" + (this._touchAxis.toUpperCase())];
      }
      distance = (current - this["_" + this._touchAxis + "1"]) * this._config.touchSensitivity;
      if (this._lastOp.angle < 0) {
        if (this._lastOp.anchor === 'right' || this._lastOp.anchor === 'bottom') {
          delta = this["_" + this._touchAxis + "Last"] - distance;
        } else {
          delta = this["_" + this._touchAxis + "Last"] + distance;
        }
        if (delta > 0) {
          delta = 0;
        }
      } else {
        if (this._lastOp.anchor === 'right' || this._lastOp.anchor === 'bottom') {
          delta = this["_" + this._touchAxis + "Last"] + distance;
        } else {
          delta = this["_" + this._touchAxis + "Last"] - distance;
        }
        if (delta < 0) {
          delta = 0;
        }
      }
      this._lastOp.angle = delta = this._normalizeAngle(delta);
      this._lastOp.fn.call(this, delta, this._lastOp.anchor, this._lastOp.options);
      return this._config.touchMoveCallback(delta, e);
    };

    OriDomi.prototype._onTouchEnd = function(e) {
      if (!this._touchEnabled) {
        return;
      }
      this._touchStarted = this._inTrans = false;
      this.el.style.cursor = css.grab;
      this._setTrans(this._config.speed, this._config.ripple);
      return this._config.touchEndCallback(this["_" + this._touchAxis + "Last"], e);
    };

    OriDomi.prototype._onTouchLeave = function(e) {
      if (!(this._touchEnabled && this._touchStarted)) {
        return;
      }
      return this._onTouchEnd(e);
    };

    OriDomi.prototype._onMouseOut = function(e) {
      if (!(this._touchEnabled && this._touchStarted)) {
        return;
      }
      if (e.toElement && !this.el.contains(e.toElement)) {
        return this._onTouchEnd(e);
      }
    };

    OriDomi.prototype._unfold = function(callback) {
      var anchor,
        _this = this;
      this._inTrans = true;
      anchor = this._lastOp.anchor;
      return this._iterate(anchor, function(panel, i, len) {
        var delay;
        delay = _this._setPanelTrans.apply(_this, [anchor].concat(__slice.call(arguments), [_this._config.speed], [1]));
        return (function(panel, i, delay) {
          return defer(function() {
            _this._transformPanel(panel, 0, _this._lastOp.anchor);
            return setTimeout(function() {
              showEl(panel.children[0]);
              if (i === len - 1) {
                _this._inTrans = _this.isFoldedUp = false;
                if (typeof callback === "function") {
                  callback();
                }
                _this._lastOp.fn = _this.accordion;
                _this._lastOp.angle = 0;
              }
              return defer(function() {
                return panel.style[css.transitionDuration] = _this._config.speed;
              });
            }, delay + _this._config.speed * .25);
          });
        })(panel, i, delay);
      });
    };

    OriDomi.prototype._iterate = function(anchor, fn) {
      var i, panel, panels, _i, _len, _ref1, _results;
      _ref1 = panels = this._panels[anchor];
      _results = [];
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        panel = _ref1[i];
        _results.push(fn.call(this, panel, i, panels.length));
      }
      return _results;
    };

    OriDomi.prototype.enableTouch = function() {
      return this._setTouch(true);
    };

    OriDomi.prototype.disableTouch = function() {
      return this._setTouch(false);
    };

    OriDomi.prototype.setSpeed = function(speed) {
      var anchor, _i, _len;
      for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
        anchor = anchorList[_i];
        this._setTrans((this._config.speed = speed), this._config.ripple, anchor);
      }
      return this;
    };

    OriDomi.prototype.freeze = function(callback) {
      var _this = this;
      if (this.isFrozen) {
        if (typeof callback === "function") {
          callback();
        }
      } else {
        this._stageReset(this._lastOp.anchor, function() {
          _this.isFrozen = true;
          hideEl(_this._stageHolder);
          showEl(_this._cloneEl);
          _this._setCursor(false);
          return typeof callback === "function" ? callback() : void 0;
        });
      }
      return this;
    };

    OriDomi.prototype.unfreeze = function() {
      if (this.isFrozen) {
        this.isFrozen = false;
        hideEl(this._cloneEl);
        showEl(this._stageHolder);
        this._setCursor();
        this._lastOp.angle = 0;
      }
      return this;
    };

    OriDomi.prototype.destroy = function(callback) {
      var _this = this;
      this.freeze(function() {
        _this._setTouch(false);
        if ($) {
          $.data(_this.el, baseName, null);
        }
        _this.el.innerHTML = _this._cloneEl.innerHTML;
        _this.el.classList.remove(elClasses.active);
        return typeof callback === "function" ? callback() : void 0;
      });
      return null;
    };

    OriDomi.prototype.emptyQueue = function() {
      var _this = this;
      this._queue = [];
      defer(function() {
        return _this._inTrans = false;
      });
      return this;
    };

    OriDomi.prototype.setRipple = function(dir) {
      if (dir == null) {
        dir = 1;
      }
      this._config.ripple = Number(dir);
      this.setSpeed(this._config.speed);
      return this;
    };

    OriDomi.prototype.constrainAngle = function(angle) {
      this._config.maxAngle = parseFloat(angle, 10) || defaults.maxAngle;
      return this;
    };

    OriDomi.prototype.wait = function(ms) {
      var fn,
        _this = this;
      fn = function() {
        return setTimeout(_this._conclude, ms);
      };
      if (this._inTrans) {
        this._queue.push([fn, this._lastOp.angle, this._lastOp.anchor, this._lastOp.options]);
      } else {
        fn();
      }
      return this;
    };

    OriDomi.prototype.modifyContent = function(fn) {
      var anchor, i, panel, selectors, set, _i, _j, _len, _len1, _ref1;
      if (typeof fn !== 'function') {
        selectors = fn;
        set = function(el, content, style) {
          var key, value;
          if (content) {
            el.innerHTML = content;
          }
          if (style) {
            for (key in style) {
              value = style[key];
              el.style[key] = value;
            }
            return null;
          }
        };
        fn = function(el) {
          var content, match, selector, style, value, _i, _len, _ref1;
          for (selector in selectors) {
            value = selectors[selector];
            content = style = null;
            if (typeof value === 'string') {
              content = value;
            } else {
              content = value.content, style = value.style;
            }
            if (selector === '') {
              set(el, content, style);
              continue;
            }
            _ref1 = el.querySelectorAll(selector);
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              match = _ref1[_i];
              set(match, content, style);
            }
          }
          return null;
        };
      }
      for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
        anchor = anchorList[_i];
        _ref1 = this._panels[anchor];
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          panel = _ref1[i];
          fn(panel.children[0].children[0], i, anchor);
        }
      }
      return this;
    };

    OriDomi.prototype.accordion = prep(function(angle, anchor, options) {
      var _this = this;
      return this._iterate(anchor, function(panel, i) {
        var deg;
        if (i % 2 !== 0 && !options.twist) {
          deg = -angle;
        } else {
          deg = angle;
        }
        if (options.sticky) {
          if (i === 0) {
            deg = 0;
          } else if (i > 1 || options.stairs) {
            deg *= 2;
          }
        } else {
          if (i !== 0) {
            deg *= 2;
          }
        }
        if (options.stairs) {
          deg *= -1;
        }
        _this._transformPanel(panel, deg, anchor, options.fracture);
        if (_this._shading && !(i === 0 && options.sticky) && Math.abs(deg) !== 180) {
          return _this._setShader(i, anchor, deg);
        }
      });
    });

    OriDomi.prototype.curl = prep(function(angle, anchor, options) {
      var _this = this;
      angle /= __indexOf.call(anchorListV, anchor) >= 0 ? this._config.vPanels : this._config.hPanels;
      return this._iterate(anchor, function(panel, i) {
        _this._transformPanel(panel, angle, anchor);
        if (_this._shading) {
          return _this._setShader(i, anchor, 0);
        }
      });
    });

    OriDomi.prototype.ramp = prep(function(angle, anchor, options) {
      var _this = this;
      this._transformPanel(this._panels[anchor][1], angle, anchor);
      return this._iterate(anchor, function(panel, i) {
        if (i !== 1) {
          _this._transformPanel(panel, 0, anchor);
        }
        if (_this._shading) {
          return _this._setShader(i, anchor, 0);
        }
      });
    });

    OriDomi.prototype.foldUp = prep(function(anchor, callback) {
      var _this = this;
      if (this.isFoldedUp) {
        return typeof callback === "function" ? callback() : void 0;
      }
      return this._stageReset(anchor, function() {
        _this._inTrans = _this.isFoldedUp = true;
        return _this._iterate(anchor, function(panel, i, len) {
          var delay, duration;
          duration = _this._config.speed;
          if (i === 0) {
            duration /= 2;
          }
          delay = _this._setPanelTrans.apply(_this, [anchor].concat(__slice.call(arguments), [duration], [2]));
          return (function(panel, i, delay) {
            return defer(function() {
              _this._transformPanel(panel, (i === 0 ? 90 : 170), anchor);
              return setTimeout(function() {
                if (i === 0) {
                  _this._inTrans = false;
                  return typeof callback === "function" ? callback() : void 0;
                } else {
                  return hideEl(panel.children[0]);
                }
              }, delay + _this._config.speed * .25);
            });
          })(panel, i, delay);
        });
      });
    });

    OriDomi.prototype.unfold = prep(function(callback) {
      return this._unfold.apply(this, arguments);
    });

    OriDomi.prototype.map = function(fn) {
      var _this = this;
      return prep(function(angle, anchor, options) {
        return _this._iterate(anchor, function(panel, i, len) {
          return _this._transformPanel(panel, fn(angle, i, len), anchor, options.fracture);
        });
      }).bind(this);
    };

    OriDomi.prototype.reset = function(callback) {
      return this.accordion(0, {
        callback: callback
      });
    };

    OriDomi.prototype.reveal = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.sticky = true;
      return this.accordion(angle, anchor, options);
    };

    OriDomi.prototype.stairs = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.stairs = options.sticky = true;
      return this.accordion(angle, anchor, options);
    };

    OriDomi.prototype.fracture = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.fracture = true;
      return this.accordion(angle, anchor, options);
    };

    OriDomi.prototype.twist = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.fracture = options.twist = true;
      return this.accordion(angle / 10, anchor, options);
    };

    OriDomi.prototype.collapse = function(anchor, options) {
      if (options == null) {
        options = {};
      }
      options.sticky = false;
      return this.accordion(-this._config.maxAngle, anchor, options);
    };

    OriDomi.prototype.collapseAlt = function(anchor, options) {
      if (options == null) {
        options = {};
      }
      options.sticky = false;
      return this.accordion(this._config.maxAngle, anchor, options);
    };

    OriDomi.VERSION = '1.0.1';

    OriDomi.isSupported = isSupported;

    return OriDomi;

  })();

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = OriDomi;
  } else if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
    define(function() {
      return OriDomi;
    });
  } else {
    window.OriDomi = OriDomi;
  }

  if (!$) {
    return;
  }

  $.prototype.oriDomi = function(options) {
    var el, instance, method, methodName, _i, _j, _len, _len1;
    if (!isSupported) {
      return this;
    }
    if (options === true) {
      return $.data(this[0], baseName);
    }
    if (typeof options === 'string') {
      methodName = options;
      if (typeof (method = OriDomi.prototype[methodName]) !== 'function') {
        if (typeof console !== "undefined" && console !== null) {
          console.warn("OriDomi: No such method `" + methodName + "`");
        }
        return this;
      }
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        el = this[_i];
        if (!(instance = $.data(el, baseName))) {
          instance = $.data(el, baseName, new OriDomi(el, options));
        }
        method.apply(instance, Array.prototype.slice.call(arguments).slice(1));
      }
    } else {
      for (_j = 0, _len1 = this.length; _j < _len1; _j++) {
        el = this[_j];
        if (instance = $.data(el, baseName)) {
          continue;
        } else {
          $.data(el, baseName, new OriDomi(el, options));
        }
      }
    }
    return this;
  };

}).call(this);

/*
//@ sourceMappingURL=oridomi.map
*/
/**
 * jquery.slicebox.js v1.1.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */

;( function( $, window, undefined ) {
	
	'use strict';

	/*
	* debouncedresize: special jQuery event that happens once after a window resize
	*
	* latest version and complete README available on Github:
	* https://github.com/louisremi/jquery-smartresize/blob/master/jquery.debouncedresize.js
	*
	* Copyright 2011 @louis_remi
	* Licensed under the MIT license.
	*/
	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 50
	};

	// ======================= imagesLoaded Plugin ===============================
	// https://github.com/desandro/imagesloaded

	// $('#my-container').imagesLoaded(myFunction)
	// execute a callback when all images have loaded.
	// needed because .load() doesn't work on cached images

	// callback function gets image collection as argument
	//  this is the container

	// original: mit license. paul irish. 2010.
	// contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

	// blank image data-uri bypasses webkit log warning (thx doug jones)
	var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

	$.fn.imagesLoaded = function( callback ) {
		var $this = this,
			deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
			hasNotify = $.isFunction(deferred.notify),
			$images = $this.find('img').add( $this.filter('img') ),
			loaded = [],
			proper = [],
			broken = [];

		// Register deferred callbacks
		if ($.isPlainObject(callback)) {
			$.each(callback, function (key, value) {
				if (key === 'callback') {
					callback = value;
				} else if (deferred) {
					deferred[key](value);
				}
			});
		}

		function doneLoading() {
			var $proper = $(proper),
				$broken = $(broken);

			if ( deferred ) {
				if ( broken.length ) {
					deferred.reject( $images, $proper, $broken );
				} else {
					deferred.resolve( $images );
				}
			}

			if ( $.isFunction( callback ) ) {
				callback.call( $this, $images, $proper, $broken );
			}
		}

		function imgLoaded( img, isBroken ) {
			// don't proceed if BLANK image, or image is already loaded
			if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
				return;
			}

			// store element in loaded images array
			loaded.push( img );

			// keep track of broken and properly loaded images
			if ( isBroken ) {
				broken.push( img );
			} else {
				proper.push( img );
			}

			// cache image and its state for future calls
			$.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

			// trigger deferred progress method if present
			if ( hasNotify ) {
				deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
			}

			// call doneLoading and clean listeners if all images are loaded
			if ( $images.length === loaded.length ){
				setTimeout( doneLoading );
				$images.unbind( '.imagesLoaded' );
			}
		}

		// if no images, trigger immediately
		if ( !$images.length ) {
			doneLoading();
		} else {
			$images.bind( 'load.imagesLoaded error.imagesLoaded', function( event ){
				// trigger imgLoaded
				imgLoaded( event.target, event.type === 'error' );
			}).each( function( i, el ) {
				var src = el.src;

				// find out if this image has been already checked for status
				// if it was, and src has not changed, call imgLoaded on it
				var cached = $.data( el, 'imagesLoaded' );
				if ( cached && cached.src === src ) {
					imgLoaded( el, cached.isBroken );
					return;
				}

				// if complete is true and browser supports natural sizes, try
				// to check for image status manually
				if ( el.complete && el.naturalWidth !== undefined ) {
					imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
					return;
				}

				// cached images don't fire load sometimes, so we reset src, but only when
				// dealing with IE, or image is complete (loaded) and failed manual check
				// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
				if ( el.readyState || el.complete ) {
					el.src = BLANK;
					el.src = src;
				}
			});
		}

		return deferred ? deferred.promise( $this ) : $this;
	};

	// global
	var $window = $( window ),
		Modernizr = window.Modernizr;

	$.Slicebox = function( options, element ) {
		
		this.$el = $( element );
		this._init( options );
		
	};

	$.Slicebox.defaults = {
		// (v)ertical, (h)orizontal or (r)andom
		orientation : 'v',
		// perspective value
		perspective : 1200,
		// number of slices / cuboids
		// needs to be an odd number 15 => number > 0 (if you want the limit higher, change the _validate function).
		cuboidsCount : 5,
		// if true then the number of slices / cuboids is going to be random (cuboidsCount is overwitten)
		cuboidsRandom : false,
		// the range of possible number of cuboids if cuboidsRandom is true
		// it is strongly recommended that you do not set a very large number :)
		maxCuboidsCount : 5,
		// each cuboid will move x pixels left / top (depending on orientation). The middle cuboid doesn't move. the middle cuboid's neighbors will move disperseFactor pixels
		disperseFactor : 0,
		// color of the hidden sides
		colorHiddenSides : '#222',
		// the animation will start from left to right. The left most cuboid will be the first one to rotate
		// this is the interval between each rotation in ms
		sequentialFactor : 150,
		// animation speed
		// this is the speed that takes "1" cuboid to rotate
		speed : 600,
		// transition easing
		easing : 'ease',
		// if true the slicebox will start the animation automatically
		autoplay : false,
		// time (ms) between each rotation, if autoplay is true
		interval: 3000,
		// the fallback will just fade out / fade in the items
		// this is the time fr the fade effect
		fallbackFadeSpeed : 300,
		// callbacks
		onBeforeChange : function( position ) { return false; },
		onAfterChange : function( position ) { return false; },
		onReady : function() { return false; }
	};

	$.Slicebox.prototype = {

		_init : function( options ) {
			
			// options
			this.options = $.extend( true, {}, $.Slicebox.defaults, options );

			this._validate();

			// all the items
			this.$items = this.$el.children( 'li' );
			
			// total number of items
			this.itemsCount = this.$items.length;
			// if there's no items return
			if(this.itemsCount === 0 ) {

				return false;

			};

			// suport for css 3d transforms and css transitions
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;
			
			// current image index
			this.current = 0;
			
			// control if the slicebox is animating
			this.isAnimating = false;
			
			// control if slicebox is ready (all images loaded)
			this.isReady = false;
			
			// preload the images
			var self = this;
			this.$el.imagesLoaded( function() {

				// we need to hide the items except first one (current default value)
				var $current = self.$items.eq( self.current ).css( 'display', 'block' ).addClass( 'sb-current' );

				// get real size of image
				var i = new Image();
				i.src = $current.find( 'img' ).attr( 'src' );
				self.realWidth = i.width;

				// assuming all images with same size
				self._setSize();
				self._setStyle();
				self._initEvents();

				self.options.onReady();
				self.isReady = true;

				if( self.options.autoplay ) {
					
					self._startSlideshow();

				}

			});

		},
		_validate			: function( options ) {

			if( this.options.cuboidsCount < 0 ){

				this.options.cuboidsCount = 1;

			}
			else if( this.options.cuboidsCount > 15 ) {

				this.options.cuboidsCount = 15;

			}
			else if( this.options.cuboidsCount %2 === 0 ) {

				++this.options.cuboidsCount;

			}
			
			if( this.options.maxCuboidsCount < 0 ){

				this.options.maxCuboidsCount = 1;

			}
			else if( this.options.maxCuboidsCount > 15 ) {

				this.options.maxCuboidsCount = 15;

			}
			else if( this.options.maxCuboidsCount %2 === 0 ) {

				++this.options.maxCuboidsCount;

			}
			
			if( this.options.disperseFactor < 0 ) {

				this.options.disperseFactor = 0;

			}
			
			if( this.options.orientation !== 'v' && this.options.orientation !== 'h' && this.options.orientation !== 'r' ) {

				this.options.orientation = 'v';

			}

		},
		_setSize : function() {

			var $visible = this.$items.eq( this.current ).find( 'img' );

			this.size = {
				width	: $visible.width(),
				height	: $visible.height()
			};

		},
		_setStyle : function() {

			// max-width is the real size of the images
			this.$el.css( {
				//'max-width' : this.realWidth
			} );

		},
		_initEvents : function() {

			var self = this;

			$window.on( 'debouncedresize.slicebox', function( event ) {

				// assuming all images with same size
				self._setSize();

			} );

		},
		_startSlideshow: function() {

			var self = this;

			this.slideshow = setTimeout( function() {

				self._navigate( 'next' );

				if ( self.options.autoplay ) {

					self._startSlideshow();

				}

			}, this.options.interval );

		},
		_stopSlideshow: function() {

			if ( this.options.autoplay ) {

				clearTimeout( this.slideshow );
				this.isPlaying = false;
				this.options.autoplay = false;

			}

		},
		_navigate : function( dir, pos ) {

			if( this.isAnimating || !this.isReady || this.itemsCount < 2 ) {

				return false;

			}

			this.isAnimating = true;
			
			// current item's index
			this.prev = this.current;

			// if position is passed
			if( pos !== undefined ) {

				this.current = pos;

			}
			// if not check the boundaries
			else if( dir === 'next' ) {

				this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;

			}
			else if( dir === 'prev' ) {

				this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;

			}

			// callback trigger
			this.options.onBeforeChange( this.current );

			if( !this.support ) {
				
				this._fade( dir );

			}
			else {

				this._layout( dir );
				this._rotate();
			
			}

		},
		_fade : function( dir ) {

			var self = this,
				$visible = this.$items.eq( this.prev ),
				h = $visible.find( 'img' ).height();

			this.$el.css( 'height', h );
			this.$items.css( 'position', 'absolute' );
			
			this.$items.eq( this.current ).fadeIn( this.options.fallbackFadeSpeed, function() {

				$( this ).css( 'display', 'block' ).addClass( 'sb-current' );
				self.$el.css( 'height', 'auto' );
				self.$items.css( 'position', 'relative' );
				self.isAnimating = false;

			} );
			self.$items.eq( self.prev ).removeClass( 'sb-current' ).fadeOut( this.options.fallbackFadeSpeed );

		},
		_layout : function( dir ) {

			// create a structure like this and append it to the main container (this.$el):
			// <div>	wrapper with perspective
			//   <div>
			//     <div></div> front side
			//     <div></div> back side
			//     <div></div> right side
			//     <div></div> left side
			//     <div></div> top side
			//     <div></div> bottom side
			//   </div>
			//   <div>..</div>
			//   <div>..</div>
			//   <div>..</div>
			//   ...	number of slices defined in options
			// </div>

			var orientation = this.options.orientation;

			if( orientation === 'r' ) {

				orientation = Math.floor( Math.random() * 2 ) === 0 ? 'v' : 'h';

			}

			if( this.options.cuboidsRandom ) {

				this.options.cuboidsCount = Math.floor( Math.random() * this.options.maxCuboidsCount + 1 );
			
			}
			
			this._validate();
			
			var boxStyle = {
					'width' : this.size.width,
					'height' : this.size.height,
					'perspective' : this.options.perspective + 'px'
				},
				config = $.extend( this.options, {
					size : this.size,
					items : this.$items,
					direction : dir,
					prev : this.prev,
					current : this.current,
					o : orientation
				} ),
				self = this;

			this.$box = $('<div>').addClass( 'sb-perspective' ).css( boxStyle ).appendTo( this.$el );

			this.cuboids = [];

			this.$el.css( 'overflow', 'visible' );

			for( var i = 0; i < this.options.cuboidsCount; ++i ) {

				var cuboid = new $.Cuboid( config, i );
				
				this.$box.append( cuboid.getEl() );

				this.cuboids.push( cuboid );

			}

		},
		_rotate : function() {

			// hide current item
			this.$items.eq( this.prev ).removeClass( 'sb-current' ).hide();

			for( var i = 0; i < this.options.cuboidsCount; ++i ) {

				var cuboid = this.cuboids[ i ],
					self = this;

				cuboid.rotate( function( pos ) {

					if( pos === self.options.cuboidsCount - 1 ) {

						self.$el.css( 'overflow', 'hidden' );
						self.isAnimating = false;
						self.$box.remove();
						var $current = self.$items.eq( self.current );
						$current.css( 'display', 'block' ); // show() makes it inline style
						setTimeout(function() {
							$current.addClass( 'sb-current' );
						} , 0 );
						self.options.onAfterChange( self.current );

					}

				});

			}

		},
		_destroy : function( callback ) {
			
			this.$el.off( '.slicebox' ).removeData( 'slicebox' );
			$window.off( '.slicebox' );
			callback.call();

		},
		// public methos: adds more items to the slicebox
		add : function( $items, callback ) {

			this.$items = this.$items.add( $items );
			this.itemsCount = this.$items.length;

			if ( callback ) {

				callback.call( $items );

			}

		},
		// public method: shows next image
		next : function() {

			this._stopSlideshow();
			this._navigate( 'next' );

		},
		// public method: shows previous image
		previous : function() {

			this._stopSlideshow();
			this._navigate( 'prev' );

		},
		// public method: goes to a specific image
		jump : function( pos ) {

			pos -= 1;

			if( pos === this.current || pos >= this.itemsCount || pos < 0 ) {

				return false;

			}

			this._stopSlideshow();
			this._navigate( pos > this.current ? 'next' : 'prev', pos );

		},
		// public method: starts the slideshow
		// any call to next(), previous() or jump() will stop the slideshow
		play : function() {

			if( !this.isPlaying ) {

				this.isPlaying = true;

				this._navigate( 'next' );
				this.options.autoplay = true;
				this._startSlideshow();

			}

		},
		// publicc methos: pauses the slideshow
		pause : function() {

			if( this.isPlaying ) {

				this._stopSlideshow();

			}

		},
		// public method: check if isAnimating is true
		isActive : function() {

			return this.isAnimating;

		},
		// publicc methos: destroys the slicebox instance
		destroy : function( callback ) {

			this._destroy( callback );
		
		}

	};

	$.Cuboid = function( config, pos ) {

		this.config = config;
		this.pos = pos;
		this.side = 1;
		this._setSize();
		this._configureStyles();

	};

	$.Cuboid.prototype = {

		_setSize : function() {

			this.size = {
				width : this.config.o === 'v' ? Math.floor( this.config.size.width / this.config.cuboidsCount ) : this.config.size.width,
				height : this.config.o === 'v' ? this.config.size.height : Math.floor( this.config.size.height / this.config.cuboidsCount )
			};
			// extra space to fix gaps
			this.extra = this.config.o === 'v' ? this.config.size.width - ( this.size.width * this.config.cuboidsCount ) : this.config.size.height - ( this.size.height * this.config.cuboidsCount );

		},
		_configureStyles : function() {

			// style for the cuboid element
			// set z-indexes based on the cuboid's position
			var middlepos = Math.ceil( this.config.cuboidsCount / 2 ),
				positionStyle = this.pos < middlepos ? {
					zIndex : ( this.pos + 1 ) * 100,
					left : ( this.config.o === 'v' ) ? this.size.width * this.pos : 0,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height * this.pos
				} : {
					zIndex : (this.config.cuboidsCount - this.pos) * 100,
					left : ( this.config.o === 'v' ) ? this.size.width * this.pos : 0,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height * this.pos
				};

			// how much this cuboid is going to move (left or top values)
			this.disperseFactor = this.config.disperseFactor * ( ( this.pos + 1 ) - middlepos );

			this.style = $.extend( {
				'-webkit-transition' : '-webkit-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'-moz-transition' : '-moz-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'-o-transition' : '-o-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'-ms-transition' : '-ms-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'transition' : 'transform ' + this.config.speed + 'ms ' + this.config.easing
			}, positionStyle, this.size );

			this.animationStyles = {
				side1 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px )' },
				side2 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px ) rotate3d( 1, 0, 0, -90deg )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px ) rotate3d( 0, 1, 0, -90deg )' },
				side3 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px ) rotate3d( 1, 0, 0, -180deg )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px ) rotate3d( 0, 1, 0, -180deg )' },
				side4 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px ) rotate3d( 1, 0, 0, -270deg )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px ) rotate3d( 0, 1, 0, -270deg )' }
			};

			var measure = ( this.config.o === 'v' ) ? this.size.height : this.size.width;

			this.sidesStyles = {
				frontSideStyle : {
					width : ( this.config.o === 'v' ) ? this.size.width + this.extra : this.size.width,
					height : ( this.config.o === 'v' ) ? this.size.height : this.size.height + this.extra,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, 0deg ) translate3d( 0, 0, ' + ( measure / 2 ) + 'px )'
				},
				backSideStyle : {
					width : this.size.width,
					height : this.size.height,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, 180deg ) translate3d( 0, 0, ' + ( measure / 2 ) + 'px ) rotateZ( 180deg )'
				},
				rightSideStyle : {
					width : measure,
					height : ( this.config.o === 'v' ) ? this.size.height : this.size.height + this.extra,
					left : ( this.config.o === 'v' ) ? this.size.width / 2 - this.size.height / 2 : 0,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, 90deg ) translate3d( 0, 0, ' + ( this.size.width / 2 ) + 'px )'
				},
				leftSideStyle : {
					width : measure,
					height : ( this.config.o === 'v' ) ? this.size.height : this.size.height + this.extra,
					left : ( this.config.o === 'v' ) ? this.size.width / 2 - this.size.height / 2  : 0,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, -90deg ) translate3d( 0, 0, ' + ( this.size.width / 2 ) + 'px )'
				},
				topSideStyle : {
					width : ( this.config.o === 'v' ) ? this.size.width + this.extra : this.size.width,
					height : measure,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height / 2 - this.size.width / 2,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 1, 0, 0, 90deg ) translate3d( 0, 0, ' + ( this.size.height / 2 ) + 'px )'
				},
				bottomSideStyle : {
					width : ( this.config.o === 'v' ) ? this.size.width + this.extra : this.size.width,
					height : measure,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height / 2 - this.size.width / 2,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 1, 0, 0, -90deg ) translate3d( 0, 0, ' + ( this.size.height / 2 ) + 'px )'
				}
			};

		},
		getEl : function() {

			this.$el = $('<div/>').css( this.style )
					.css( this.animationStyles.side1 )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.frontSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.backSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.rightSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.leftSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.topSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.bottomSideStyle ) );
			
			this._showImage( this.config.prev );
			
			return this.$el;

		},
		_showImage : function( imgPos ) {

			var sideIdx,
				$item = this.config.items.eq( imgPos ),
				imgParam = {
					'background-size' : this.config.size.width + 'px ' + this.config.size.height + 'px'
				};

			imgParam.backgroundImage = 'url(' + $item.find( 'img' ).attr('src') + ')';
			
			switch( this.side ) {

				case 1 : sideIdx = 0; break;
				case 2 : sideIdx = ( this.config.o === 'v' ) ? 4 : 2; break;
				case 3 : sideIdx = 1; break;
				case 4 : sideIdx = ( this.config.o === 'v' ) ? 5 : 3; break;

			};

			imgParam.backgroundPosition = ( this.config.o === 'v' ) ? - ( this.pos * this.size.width ) + 'px 0px' : '0px -' + ( this.pos * this.size.height ) + 'px';
			this.$el.children().eq( sideIdx ).css( imgParam );

		},
		rotate : function( callback ) {

			var self = this, animationStyle;

			setTimeout(function() {

				if( self.config.direction === 'next' ) {

					switch( self.side ) {
						case 1 : animationStyle = self.animationStyles.side2; self.side = 2; break;
						case 2 : animationStyle = self.animationStyles.side3; self.side = 3; break;
						case 3 : animationStyle = self.animationStyles.side4; self.side = 4; break;
						case 4 : animationStyle = self.animationStyles.side1; self.side = 1; break;
					};
				
				}
				else {

					switch( self.side ) {
						case 1 : animationStyle = self.animationStyles.side4; self.side = 4; break;
						case 2 : animationStyle = self.animationStyles.side1; self.side = 1; break;
						case 3 : animationStyle = self.animationStyles.side2; self.side = 2; break;
						case 4 : animationStyle = self.animationStyles.side3; self.side = 3; break;
					};

				}
				
				self._showImage( self.config.current );
				
				var animateOut 	= {}, animateIn	= {};
				
				if( self.config.o === 'v' ) {

					animateOut.left = '+=' + self.disperseFactor + 'px';
					animateIn.left = '-=' + self.disperseFactor + 'px';
				
				}
				else if( self.config.o === 'h' ) {

					animateOut.top = '+=' + self.disperseFactor + 'px';
					animateIn.top = '-=' + self.disperseFactor + 'px';
				
				}

				self.$el.css( animationStyle ).animate( animateOut, self.config.speed / 2 ).animate( animateIn, self.config.speed / 2 , function() {
					
					if( callback ) {

						callback.call( self, self.pos );

					}

				});

			}, this.config.sequentialFactor * this.pos + 30 );

		}

	};
	
	var logError = function( message ) {

		if ( window.console ) {

			window.console.error( message );
		
		}

	};
	
	$.fn.slicebox = function( options ) {

		var self = $.data( this, 'slicebox' );
		
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			
			this.each(function() {
			
				if ( !self ) {

					logError( "cannot call methods on slicebox prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				
				}
				
				if ( !$.isFunction( self[options] ) || options.charAt(0) === "_" ) {

					logError( "no such method '" + options + "' for slicebox self" );
					return;
				
				}
				
				self[ options ].apply( self, args );
			
			});
		
		} 
		else {
		
			this.each(function() {
				
				if ( self ) {

					self._init();
				
				}
				else {

					self = $.data( this, 'slicebox', new $.Slicebox( options, this ) );
				
				}

			});
		
		}
		
		return self;
		
	};
	
} )( jQuery, window );
/*
 *  jQuery $.greyScale Plugin v0.2
 *  Written by Andrew Pryde (www.pryde-design.co.uk)
 *  Date: Mon 1 Aug 2011
 *  Licence: MIT Licence
 *
 *  Copyright (c) 2011 Andrew Pryde
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this 
 *  software and associated documentation files (the "Software"), to deal in the Software
 *  without restriction, including without limitation the rights to use, copy, modify, merge,
 *  publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
 *  to whom the Software is furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all copies or 
 *  substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 *  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 *  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
 (function(a){a.fn.greyScale=function(c){$options=a.extend({fadeTime:a.fx.speeds._default,reverse:false},c);function b(f,e,d){can=a("<canvas>").css({display:"none",left:"0",position:"absolute",top:"0"}).attr({width:e,height:d}).addClass("gsCanvas");ctx=can[0].getContext("2d");ctx.drawImage(f,0,0,e,d);imageData=ctx.getImageData(0,0,e,d);px=imageData.data;for(i=0;i<px.length;i+=4){grey=px[i]*0.3+px[i+1]*0.59+px[i+2]*0.11;px[i]=px[i+1]=px[i+2]=grey}ctx.putImageData(imageData,0,0);return can}if(navigator.userAgent.match(/msie/i) && navigator.userAgent.match(/6/)){this.each(function(){var d=$options.reverse?0:1;a(this).css({filter:"progid:DXImageTransform.Microsoft.BasicImage(grayscale="+d+")",zoom:"1"});a(this).hover(function(){var e=$options.reverse?1:0;a(this).css({filter:"progid:DXImageTransform.Microsoft.BasicImage(grayscale="+e+")"})},function(){var e=$options.reverse?0:1;a(this).css("filter","progid:DXImageTransform.Microsoft.BasicImage(grayscale="+e+")")})})}else{this.each(function(d){a(this).wrap('<div class="gsWrapper">');gsWrapper=a(this).parent();gsWrapper.css({position:"relative",display:"inline-block"});if(window.location.hostname!==this.src.split("/")[2]){a.getImageData({url:a(this).attr("src"),success:a.proxy(function(e){can=b(e,e.width,e.height);if($options.reverse){can.appendTo(gsWrapper).css({display:"block",opacity:"0"})}else{can.appendTo(gsWrapper).fadeIn($options.fadeTime)}},gsWrapper),error:function(f,e){}})}else{can=b(a(this)[0],a(this).width(),a(this).height());if($options.reverse){can.appendTo(gsWrapper).css({display:"block",opacity:"0"})}else{can.appendTo(gsWrapper).fadeIn($options.fadeTime)}}});a(this).parent().delegate(".gsCanvas","mouseover mouseout",function(d){over=$options.reverse?1:0;out=$options.reverse?0:1;(d.type=="mouseover")&&a(this).stop().animate({opacity:over},$options.fadeTime);(d.type=="mouseout")&&a(this).stop().animate({opacity:out},$options.fadeTime)})}}})(jQuery);(function(X,V){function O(){}function H(c){E=[c]}function W(c,g,e){return c&&c.apply(g.context||g,e)}function U(A){function s(K){!n++&&V(function(){g();e&&(z[w]={s:[K]});x&&(K=x.apply(A,[K]));W(A.success,A,[K,G]);W(h,A,[A,G])},0)}function o(K){!n++&&V(function(){g();e&&K!=F&&(z[w]=K);W(A.error,A,[A,K]);W(h,A,[A,K])},0)}A=X.extend({},B,A);var h=A.complete,x=A.dataFilter,J=A.callbackParameter,I=A.callback,t=A.cache,e=A.pageCache,D=A.charset,w=A.url,u=A.data,C=A.timeout,c,n=0,g=O;A.abort=function(){!n++&&g()};if(W(A.beforeSend,A,[A])===false||n){return A}w=w||y;u=u?typeof u=="string"?u:X.param(u,A.traditional):y;w+=u?(/\?/.test(w)?"&":"?")+u:y;J&&(w+=(/\?/.test(w)?"&":"?")+encodeURIComponent(J)+"=?");!t&&!e&&(w+=(/\?/.test(w)?"&":"?")+"_"+(new Date).getTime()+"=");w=w.replace(/=\?(&|$)/,"="+I+"$1");e&&(c=z[w])?c.s?s(c.s[0]):o(c):V(function(L,K,M){if(!n){M=C>0&&V(function(){o(F)},C);g=function(){M&&clearTimeout(M);L[q]=L[v]=L[p]=L[r]=null;R[m](L);K&&R[m](K)};window[I]=H;L=X(l)[0];L.id=k+b++;if(D){L[a]=D}var N=function(P){(L[v]||O)();P=E;E=undefined;P?s(P[0]):o(j)};if(f.msie){L.event=v;L.htmlFor=L.id;L[q]=function(){/loaded|complete/.test(L.readyState)&&N()}}else{L[r]=L[p]=N;f.opera?(K=X(l)[0]).text="jQuery('#"+L.id+"')[0]."+r+"()":L[d]=d}L.src=w;R.insertBefore(L,R.firstChild);K&&R.insertBefore(K,R.firstChild)}},0);return A}var d="async",a="charset",y="",j="error",k="_jqjsp",v="onclick",r="on"+j,p="onload",q="onreadystatechange",m="removeChild",l="<script/>",G="success",F="timeout",f=X.browser,R=X("head")[0]||document.documentElement,z={},b=0,E,B={callback:k,url:location.href};U.setup=function(c){X.extend(B,c)};X.jsonp=U})(jQuery,setTimeout);(function(a){a.getImageData=function(b){var d=/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;if(b.url){var c=location.protocol==="https:",h="";h=b.server&&d.test(b.server)&&b.server.indexOf("https:")&&(c||b.url.indexOf("https:"))?b.server:"//img-to-json.appspot.com/?callback=?";a.jsonp({url:h,data:{url:escape(b.url)},dataType:"jsonp",timeout:10000,success:function(e){var f=new Image;a(f).load(function(){this.width=e.width;this.height=e.height;typeof b.success==typeof Function&&b.success(this)}).attr("src",e.data)},error:function(e,f){typeof b.error==typeof Function&&b.error(e,f)}})}else{typeof b.error==typeof Function&&b.error(null,"no_url")}}})(jQuery);
