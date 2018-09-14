// Kenburn Fancy Advertising Plugin
// Date: 14/02/2017
// Author: Black Spider(TinyDeveloper)
// Copyright: All rights reserved to BS

(function($)
{
	//slider object
	var object;
	//interface for bs_slider
	$.fn.bs_kenburn = function(options){
		 object=new bs_kenburn({
			 handle:$(this),
			 option:options
		 });	
		return object;
	};
   	//main class kenburn
	function bs_kenburn(arg)
	{
		//global variable
		//slide handler
		var handle;
		//options
		var option;
		//timer handler for autoplay
		var timer;
		//kenburn timer
		var kentimer;
		//autoplay flag
		var a_flag;
		//carousel flag
		var c_flag;
		//carousel thumbnail width
		var c_twidth=120;
		//color
		var pcolor;
		//timer step
		var t_val;
		//slide indexes
		var current_index,target_index;
		//lock flag
		var lock;
		//mouse capture flag/touch
		var mpflag,tpflag;
		//swipe direction flag key
		var sd_flag;
		//mouse offset buffer
		var mp_temp,tp_temp,cr_temp;
		//thumbnail flag
		var t_flag;
		//original rate width vs height
		var rate;
		//kenburn code
		var code;
		//overall slide length
		var length;
		//thumbnail width
		var thumb_width;
		//thumb rate
		var thumb_rate=-1;
		//default parameters
		var defaults={
			//slider width
			width:				800,
			//slider height
			height:				300,
			//auto play
			autoplay:			false,
			//interval(second)
			interval:			5,
			//fullwidth mode
			fullwidth:			false,
			//responsive
			responsive:			true,
			//progressbar
			progressbar:		true,
			//progressbar type(linear/circle)
			progressbartype:	'circle',
			//caption type
			caption_type:		'fixed',
			//caption animation
			caption_animation:	0,
			//animation
			animation:			0,
			//navigation type
			navtype:			0,
			//bullet 
			bullet:				true,
			//carousel type
			carousel:			'horizontal',
			//repeat mode
			repeat_mode:		true,
			//skin type
			skin:				'default',
			//path
			path:				'',
			//lightbox
			lightbox: 			false,
			//pause on hover 
			pause_on_hover:		true,
			//swipe mode
			swipe:				false,
			//keyboard mode
			keyboard:			false,
			//scroll mode
			scrollmode:			false,
			//custom event
			onanimstart:		function(){return false;},
			//custom event
			onanimend:			function(){return false;},
			//custom event
			onvideoplay: 		function(){return false;},
			//custom event
			onslidechange:		function(){return false;}
		};
		
		//slide handler
	  	handle=arg.handle;
	  	//option values
	  	option=$.extend({}, defaults, arg.option || {});
	  	/* initialization */
	  	bs_init();

	  	// ************* FUNCTION **************** //
	  	/* init function */
	  	function bs_init()
		{
			var width=option.width,height=option.height;
			//variable initialization
			pcolor='';
			lock=t_val=0;
			current_index=target_index=0;
			mp_flag=tp_flag=t_flag=a_flag=sd_flag=c_flag=0;
			thumb_width=0;
			length=handle.find(".bs_slide").length;
			//setup the original rate
			rate=option.width/option.height;
			// putting shadow effect
			handle.append('<div id="bs_shadow"><div class="bs_lshadow"></div><div class="bs_mshadow" style="width:'+(width-100)+'px"></div><div class="bs_rshadow"></div></div>');
			
			// putting play/pause + fullscreen icon			
			handle.append('<div class="bs_a_play default_play"></div><div id="bs_lbox"></div>');
			//if(option.autoplay) handle.find(".bs_a_play").addClass("bs_a_pause");
			/* viewport setup */
			handle.find("#bs_viewport").prepend("<div id='bs_prev' class='bs_operate'></div><div id='bs_current' class='bs_operate bs_animate'></div><div id='bs_next' class='bs_operate bs_animate'></div>");
			/* setting images into slide */
			handle.find(".bs_slide").each(function(i)
			{
				var cache=$(this);
				var src=cache.attr("image-src");
				var caption=cache.attr("data-caption");
				var des=cache.attr("data-description");
				var video=cache.attr("video-src");
				var href=cache.attr("data-link");
				if(typeof(href)=='undefined') href="#";
				if(typeof(video)=='undefined') video="";
				cache.append("<img class='bs_image' src='"+src+"' data-src='"+video+"'/>");
				if(typeof(caption)!='undefined') cache.append("<div class='bs_caption'><div><a class='bs_title' href='"+href+"'>"+caption+"</a></div><div><a class='bs_des'>"+des+"</a></div></div>");
				if(video!="")
				{
					if(option.skin=='ios7'||option.skin=='starworld'||option.skin=='nature'||option.skin=='xmas'||option.fullwidth==true)		cache.append("<img class='bs_play' src='"+option.path+"img/skin/"+option.skin+"_play.png'/>");
					else cache.append("<img class='bs_play' src='"+option.path+"img/skin/play.png'/>");
				}
				cache.find(".bs_image").on('load',function()
				{
					//image is fully loaded
					$(this).addClass("active");
				});
			});
			//functional initialization
			var pt=parseInt(handle.find(".bs_slide .bs_caption").css("font-size"));
			if(option.skin=='transformer') pt=50;
			else if(option.skin=='beach') pt=40;
	 		handle.css("width",width).css("height",height).attr("o-width",width).attr("o-height",height).attr("o-font",pt);

			rate=width/height;
			//prepare image slide show
			bs_set_current_slide(current_index,0);
			//smooth framerate
			$().framerate(100);
		}
		//set prev/current/next slides
		function bs_set_current_slide(current,init_flag)
		{
			var prev=(current-1<0)?length-1:current-1;
			var next=(current+1)%length;
			var index=[prev,current,next];
			var name_arr=["#bs_prev","#bs_current","#bs_next"];
			handle.find(".bs_operate").each(function(i)
			{
				//lazy loading
				var cache=handle.find(name_arr[i]);
				var cache1=handle.find(".bs_slide:nth-child("+(index[i]+1)+")");
				cache.html(cache1.html());
				// set zoom-in index
				var kzoom=(cache1.attr("kzoom")!=undefined)?cache1.attr("kzoom"):1;
				var kposx=(cache1.attr("kposx")!=undefined)?cache1.attr("kposx"):0;
				var kposy=(cache1.attr("kposy")!=undefined)?cache1.attr("kposy"):0;
				var qtype=(cache1.attr("qtype")!=undefined)?parseInt(cache1.attr("qtype")):0;
				// replace type of animation into others from blur
				if(qtype==1&&kzoom==1) qtype=4;
				// setting attribute to the div
				cache.attr("kzoom",kzoom);
				cache.attr("kposx",kposx);
				cache.attr("kposy",kposy);
				cache.attr("qtype",qtype);

				cache.find(".bs_image").addClass("zoompa"+qtype);

				if(!cache1.find(".bs_image").hasClass("active"))
				{

					cache.prepend("<img class='bs_load' src='"+option.path+"img/skin/"+option.skin+"_loader.gif' />");
					cache.find(".bs_image").on('load',function()
					{
						var code=$(this).parents(".bs_operate").attr("kzoom");
						// kenburn images set
						if(code==1)
							$(this).attr("width",option.width);
						else if(code==2)
							$(this).attr("width",$(this).width()).css("margin-left",-parseInt($(this).width()-option.width)/2).css("margin-top",-parseInt($(this).height()-option.height)/2);

						$(this).addClass("active");
						$(this).parent().find(".bs_load").remove();
						if(i==1&&init_flag==0)
							//start slider functions
						bs_setup();
					});
				}
				else
				{
					var code=cache.attr("kzoom");
					// kenburn images set
					if(code==1)
						cache.find(".bs_image").attr("width",option.width);
					else if(code==2)
						cache.find(".bs_image").attr("width",cache.find(".bs_image").width()).css("margin-left",-parseInt(cache.find(".bs_image").width()-option.width)/2).css("margin-top",-parseInt(cache.find(".bs_image").height()-option.height)/2);

				}
			});	
			if(option.responsive)	bs_respond();
		}
		//set up the skin
		function bs_skin_setup()
		{
			switch(option.skin)
			{
			  /* normal skin page */
			  case 'default':
			  	  option.caption_animation=2;
				  option.progressbartype='linear';
			  break;
			  case 'jumbo':
				  option.caption_animation=2;
				  option.progressbartype='linear';
			  break;
			  case 'science':
				  option.caption_animation=2;
				  option.progressbartype='linear';
			  break;
			  case 'sapphire':
				  option.caption_animation=2;
				  option.progressbartype='circle';
				  pcolor="#26a9fb";
			  break;
			  case 'ios7':
				  option.caption_animation=2;
				  option.progressbartype='linear';
				  option.navtype=1;
				  handle.append('<a id="left_btn" class="bs_nav">Previous Slide</a><a id="right_btn" class="bs_nav right_btn">Next Slide</a>');
				  c_twidth=60;
			  break;
			  case 'starworld':
				  option.caption_animation=0;
				  option.progressbartype='linear';
				  option.navtype=0;
			  break;
			  case 'nature':
				  option.caption_animation=0;
				  option.progressbartype='linear';
			  break;
			  case 'xmas':
				  option.caption_animation=0;
				  option.progressbartype='circle';
				  pcolor="#fff";
			  break;
			  /* full width skins */
			  case 'transformer':
				  option.caption_animation=3;
				  option.progressbartype='linear';
				  option.navtype=1;
			  break;
			  case 'beach':
				  option.caption_animation=3;
				  option.progressbartype='linear';
				  option.navtype=1;				  
			  break;
			}
			if(option.navtype==0)
			{
				option.bullet=true;
				option.carousel=true;
			}
			else
			{
				option.bullet=false;
				if(option.skin!='starworld'&&option.skin!='xmas'&&option.skin!='transformer') option.carousel='horizontal';
				else option.carousel='vertical';
			}
			//initialization for bullet
			if(option.bullet)
			{
				bs_bullet_setup(handle);
				handle.find(".bs_hcarousel").addClass("bs_bullet");
			}
			//initialization for carousel
			if(option.carousel!=false)
			{
			   bs_carousel_setup(option.carousel,handle);
			}
			handle.addClass("bs_"+option.skin);
			if(option.skin=='jumbo') handle.prepend('<img src="'+option.path+'img/ribbon.png" style="position:absolute;left:-20px;top:-20px;z-index:100;"/>');
			else if(option.skin=='starworld') handle.prepend('<div id="bs_numboard">1 / '+length+'</div>');
			else if(option.skin=='sapphire') handle.prepend('<div id="bs_sapphire_header"></div>');
			else if(option.skin=='xmas') handle.prepend("<div id='bs_lbal' class='bs_balcony'><img src='"+option.path+"img/skin/xmas_bal.png'/></div><div id='bs_rbal' class='bs_balcony'><img src='"+option.path+"img/skin/xmas_bal.png'/></div><div id='bs_tbal' class='bs_tbalcony'><img src='"+option.path+"img/skin/xmas_tsnow.png'/></div>");

		}
		//set up the slide
		function bs_setup()
		{
			//skin setup
		    bs_skin_setup();			
			//setup for fullwidth
			if(option.fullwidth==true)
			{
				option.width = (window.innerWidth > screen.width) ? window.innerWidth : screen.width;
				handle.css("margin-left",0).css("width",option.width).css("height",option.height);
			}
			//setup for autoplay
			if(option.autoplay==true)
			{
				handle.find(".bs_a_play").addClass("bs_a_pause");
				a_flag=1;
				bs_start();
			}
			else
			  	handle.find(".bs_a_play").removeClass("bs_a_pause");
			//setup for progressbar
			if(option.progressbar==true)
			{
				if(bs_isIE()!=false&&bs_isIE()<9)	 option.progresstype='linear';
			    bs_progressbar_setup();
			}
			handle.find("#bs_thumbnail").css("width",thumb_width*handle.find(".bs_slide").length);
			if(option.responsive==true)	bs_respond();
			//seven kenburn
			bs_layer_animate();
			//bs_kenburn();
		}
		//initialize the progress bar
		function bs_progressbar_setup()
		{
			  if(a_flag==0) return false;
			  switch(option.progressbartype)
			  {
				  case 'linear':
				  		if(handle.find("#lp_ct").length==0)
							handle.find("#bs_viewport").prepend('<div id="lp_ct" class="progressbar"><div id="lprogress"></div></div>');
				  break;
				  case 'circle':
				  		if(handle.find("#cprogress").length==0)
							handle.find("#bs_viewport").prepend('<div id="cprogress" class="progressbar"><input class="knob cprogress" data-thinkness=".1" data-skin="tron" data-linecap="round" data-fgcolor='+pcolor+' data-width="40" data-displayInput=false value="0"></div>');
						//initialize the circular bar
						handle.find(".knob").knob({
							 draw : function () {
								 // "tron" case
								 if(this.$.data('skin') == 'tron') {
									  var a = this.angle(this.cv)  // Angle
									 , sa = this.startAngle          // Previous start angle
									 , sat = this.startAngle         // Start angle
									 , ea                            // Previous end angle
									 , eat = sat + a                 // End angle
									 , r = 1;
									 this.g.lineWidth = this.lineWidth;
									 this.o.cursor
										   && (sat = eat - 0.3)
										   && (eat = eat + 0.3);
									 if (this.o.displayPrevious) {
									   ea = this.startAngle + this.angle(this.v);
									   this.o.cursor
									   && (sa = ea - 0.3)
									   && (ea = ea + 0.3);
									   this.g.beginPath();
												this.g.strokeStyle = this.pColor;
												this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sa, ea, false);
												this.g.stroke();
										}
										this.g.beginPath();
										this.g.strokeStyle = r ? this.o.fgColor : this.fgColor ;
										this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sat, eat, false);
										this.g.stroke();
										this.g.lineWidth = 2;
										this.g.beginPath();
										this.g.strokeStyle = this.o.fgColor;
										this.g.arc( this.xy, this.xy, this.radius - this.lineWidth + 1 + this.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
										this.g.stroke();
										return false;
								 }
							 }
						});
						 
				  break;
			  };
			  if(option.progress==false)
				handle.find(".progressbar").addClass("invisible");
		}
		//bullet initialization
		function bs_bullet_setup(handle)
		{
			handle.append('<div id="bs_bullet" style="height:35px;left:50%;"></div>');
			/* hovering thumbnails */
			$("<div class='bs_bt_preview'><div class='bs_filter_bt'><div class='bs_bt_container'></div></div></div>").insertAfter(handle.find("#bs_bullet"));
			/* adding bullet to the list */
			var temp_string='<a id="bs_bleft" class="bs_bullet_btn" style="float:left;background:url(img/arrowleft.png);background-position:0 100%;width:9px;height:16px;z-index:301;margin:9px;"></a>';
			handle.find(".bs_slide").each(function(i)
			{

				//bullet
				if(i==0)
				  temp_string+='<a class="active bs_index" style="display:block;float:left;background:url(img/navidot.png);width:15px;height:15px;z-index:301;margin:9px;"></a>';
				else
				  temp_string+='<a class="bs_index" style="display:block;float:left;background:url(img/navidot.png);background-position:0 100%;width:15px;height:15px;z-index:301;margin:9px;"></a>';
				// check whether last item
				if(i==length-1)
				{
					temp_string+='<a id="bs_bright" class="bs_bullet_btn" style="float:left;background:url(img/arrowright.png);background-position:0 100%;width:9px;height:16px;z-index:301;top:9px;margin:9px;"></a>';
					$("#bs_bullet").append(temp_string);
					$("#bs_bullet").css("margin-left",($("#bs_bullet").width()/2)*(-1));
				}
				// insert bullet preview container
				handle.find(".bs_bt_container").append("<div class='bs_bt_slide'><img class='bs_preview_img' src='"+$(this).find(".bs_image").attr("src")+"'/></div>");
			});
			handle.find(".bs_bt_container").css("width",40*length);	  
		}
		//carousel initialization
		function bs_carousel_setup(carousel,handle)
		{
			var carousel_width=0;
			var left=0;
			carousel_width=(option.width-100>c_twidth*length)?c_twidth*length:option.width-100;
			left=(option.width-carousel_width)/2-8;
			// putting thumbnails
			handle.append('<div id="bs_carousel" style="width:'+carousel_width+'px;height:80px;left:'+left+'px;overflow:hidden;"><div id="bs_tviewport" style="width:'+length*c_twidth+'px;height:100%;position:absolute;left:0;overflow:hidden"></div></div>');
			handle.find(".bs_slide").each(function(i)
			{
				  var src=$(this).find(".bs_image").attr("src");
				  if(i==0)
				  	handle.find("#bs_tviewport").append("<div class='carousel active' style='width:"+c_twidth+"px;float:left;'><div class='bs_ci'><img src='"+src+"' width='"+c_twidth+"'/></div></div>"); 
				  else
					handle.find("#bs_tviewport").append("<div class='carousel' style='width:"+c_twidth+"px;float:left;'><div class='bs_ci'><img src='"+src+"' width='"+c_twidth+"'/></div></div>"); 
			});
			thumb_rate=(handle.find("#bs_tviewport").width()-carousel_width)/(carousel_width-100);
		}
		//adjust carousel pos 
		function bs_adjust_carousel(arg)
		{
			switch(option.carousel)
			{
				case 'horizontal':
					var twidth=handle.find(".bs_hcarousel").width();
					if(c_flag==1)
					{					
						return false;
					}
					if(thumb_width*length<option.width) return false;
					var cache=handle.find("#bs_hsubboard");
					var board=handle.find("#bs_hviewport");
					var offset=thumb_width*target_index;
					if(offset+twidth>board.width())  offset=twidth-board.width();
					else offset=-thumb_width*target_index;
					cache.animate({"marginLeft":offset},{duration:200,easing:"easeOutSine"});
				break;
				case 'vertical':
					if(c_flag==1)
					{					
						return false;
					}
					if(60*length<option.height) return false;
					var cache=handle.find("#bs_vsubboard");
					var board=handle.find("#bs_vviewport");
					var offset=60*target_index;
					if(offset+option.height>board.height())  offset=option.height-board.height();
					else offset=-60*target_index;
					if(option.skin!='transformer') cache.animate({"marginTop":offset},{duration:200,easing:"easeOutSine"});
				break;
			}
			
		}
		//2d animation
		function bs_2d_animate(code)
		{
			switch(code)
			{
				case 1:
					bs_linear_move(0);
				break;
				case 2:
					bs_linear_move(1);
				break;
				case 3:
					bs_linear_move(2);
				break;
				case 4:
					bs_linear_move(3);
				break;
				case 5:
					bs_fade();
				break;
				case 6:
					bs_fade_overlap();
				break;
			}
		}
		/* 2d functions */
		function bs_linear_move(code)
		{
			var p_arr=[[100,0,0,0],[-100,0,0,0],[0,100,0,0],[0,-100,0,0]];
			var t_arr=[[-option.width,0],[option.width,0],[0,-option.height],[0,option.height]];
			//initialize for anim
			handle.find("#bs_next").css("left",p_arr[code][0]+"%").css("top",p_arr[code][1]+"%");
			handle.find("#bs_current").css("left",p_arr[code][2]+"%").css("top",p_arr[code][3]+"%");
			//anim func
			handle.find('.bs_animate').each(function(i)
			{
				$(this).animate({
					"left":"+="+t_arr[code][0]+"px",
					"top":"+="+t_arr[code][1]+"px",
				},
				{
					duration:700,
					easing:"easeOutSine",
					complete: function()
					{
						 //All animation is done
						 if(i==0) bs_animate_end(); 
					}
				});
			});
		}
		function bs_fade()
		{
		   //initialize for anim
			handle.find("#bs_next").css("left","0%").css("top","0%");
			handle.find("#bs_current").css("left","0%").css("top","0%");		
					
			//prepare for anim
			handle.find("#bs_next").css("opacity",0);
					
			//anim func
			handle.find("#bs_next").animate({
				"opacity":1,
			},
			{
				duration:800,
				easing:"easeOutSine",
				complete: function()
				{	
					// All animation is done
					bs_animate_end(); 
				}												 
					
			});
		}
		function bs_fade_overlap()
		{
		   var pimagewidth=handle.find("#bs_current .bs_image").width(),pimageheight=handle.find("#bs_current .bs_image").height(),psrc=handle.find("#bs_current .bs_image").attr("src");
			var nimagewidth=handle.find("#bs_next .bs_image").width(),nimageheight=handle.find("#bs_next .bs_image").height(),nsrc=handle.find("#bs_next .bs_image").attr("src");
			var pl,pt;
			pl=parseInt(handle.find("#bs_next .bs_image").css("marginLeft"));
			pt=parseInt(handle.find("#bs_next .bs_image").css("marginTop"));			
		   //initialize for anim
			handle.find("#bs_next").css("left","100%").css("top","0%");
			handle.find("#bs_current").css("left","0%").css("top","0%");	
			//prepare temp divs for transition
			var blind="<div id='bs_blind_container' style='position:absolute;width:100%;height:100%;z-index:80'>";
			var b_pos=[[-100,-100],[-100,100],[100,100],[100,-100]];
			for(var i=0;i<4;i++)
			{
				//calculate div pos
				blind+="<div class='bs_blind_slide' style='position:absolute;overflow:hidden;width:100%;height:100%;'><img src='"+nsrc+"' style='position:absolute;width:"+nimagewidth+"px;height:"+nimageheight+"px;left:"+b_pos[i][0]+"px;top:"+b_pos[i][1]+"px;margin-left:"+pl+"px;margin-top:"+pt+"px;'/></div>";		
			}
			blind+="</div>";
			$(blind).insertBefore(handle.find("#bs_next"));
			handle.find(".bs_blind_slide img").css("opacity",0);
					
			//anim func
			handle.find(".bs_blind_slide img").each(function(i)
			{
				$(this).animate({
					"left":0,
					"top":0,
					"opacity":1,
				},
				{
					duration:600,
					easing:"easeOutQuad",
					complete: function()
					{	
						 // All animation is done
						 if(i==3)
							bs_animate_end(); 
					}												 
				});
			});
		}
		//end animate 
		function bs_animate_end()
		{
			var opacity;
			handle.find("#bs_blind_container").remove();
			handle.find(".bs_cube").remove();
			handle.find(".bs_operate").stop();
			handle.find("#bs_current").css("left",0).css("top",0);
			handle.find("#bs_next").css("left","100%").css("top","0%");
			//set current slide
			current_index=target_index;
			bs_set_current_slide(current_index);
			// set slide imagesize
			var code=handle.find("#bs_current").attr("kzoom");
			if(code==1)
				handle.find("#bs_current .bs_image").attr("width",option.width);
			else{
				var arr=Array();
				arr.width=handle.find("#bs_current").find(".bs_image").width();
				arr.height=handle.find("#bs_current .bs_image").height();
				handle.find("#bs_current .bs_image").attr("width",arr.width).css("margin-left",-parseInt(arr.width-option.width)/2).css("margin-top",-parseInt(arr.height-option.height)/2);
			}	
			bs_layer_animate();
			//bs_caption_end_animate();
		}
		//check if Browser is IE and return version No.
		function bs_isIE () {
			var myNav = navigator.userAgent.toLowerCase();
			return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
		}
		//preview slide on mousehover
		function bs_thumb_preview(arg){	  	
			// calculate bullet(circle box) left position to show
			var tleft=handle.find("#bs_bullet").position().left-126;  
			var temp=parseInt(handle.find(".bs_index").width())+2*parseInt(handle.find(".bs_index").css("margin-left"));	  
			var tpad=parseInt(handle.find("#bs_bullet").css("padding-left"));
			handle.find('.bs_bt_preview').css("left",tleft);
			switch(t_flag)
			{
				  //When newly hover
				  case 0:
					  //calculate circle width including margin
					  handle.find('.bs_bt_preview').css("margin-left",tpad+arg*temp-33+temp/2);
					  handle.find('.bs_bt_container').css('margin-left',-40*(arg-1));
					  handle.find(".bs_bt_preview").fadeIn(200);	
				  break;
				  //consequent hover
				  case 1:
					  //calculate circle width including margin
					  var temp=parseInt(handle.find(".bs_index").width())+2*parseInt(handle.find(".bs_index").css("margin-left"));
					  
					  handle.find('.bs_bt_preview').delay(50).animate({
								"margin-left":tpad+arg*temp-33+temp/2,
						   },
						   {
								duration:200,
								queue:false,
								easing:"easeOutSine"
						   });
						  handle.find('.bs_bt_container').animate({
								"margin-left":-40*(arg-1),
						   },
						   {
								duration:200,
								queue:false,
								easing:"easeOutSine"
						   });
					  break;
			}
			//flag for thumbnail anim(switch to consequent hover from newly hover)
			if(t_flag==0)	 t_flag=1;
		}
		//get imageSize
		function bs_get_imagesize(src)
		{
			var arr=[];
			var hiddenImg = src.clone().css('visibility', 'hidden').removeAttr('height').removeAttr('width').appendTo('body');
			arr.width=hiddenImg.width();
			arr.height=hiddenImg.height();
			hiddenImg.remove();
			return arr;
		}
		//start autoplay
		function bs_start()
		{
			  if(lock==1)
					return;
			  var cache=handle.find(".progressbar");
			  cache.show();	  
			  if(!cache.hasClass("on"))
			  {
				  cache.addClass("on");
				  switch(option.progressbartype)
				  {
					  case 'linear':
							timer=setInterval(bs_linear_automate,50);
							handle.find("#lprogress").css("width",t_val);
					  break;
					  case 'circle':
							timer=setInterval(bs_index_automate,50);		  
							handle.find('.cprogress').val(t_val).trigger('change'); 
					  break;
				  }
			}
		}
		//pause autoplay
		function bs_pause()
		{
			clearInterval(timer);
			handle.find(".progressbar").removeClass("on");
		}
		//stop autoplay
		function bs_stop()
		{
			clearInterval(timer);
			handle.find(".progressbar").hide();
			handle.find("#lprogress").css("width",0);
			handle.find(".progressbar").removeClass("on");
			t_val=0;
		}
		//hide preview slide on mouseout
		function bs_thumb_hide()
		{
			//thumbnail flag switch to newly hover
			t_flag=0;
			handle.find(".bs_bt_preview").hide();
		}
		//show lightbox
		function bs_lightbox_setup()
		{
			if(option.lightbox==true&&handle.find("#bs_lightbox").length<1)
			{
				/* subworking */
				a_flag=0;
				handle.find(".bs_a_play").addClass("bs_a_pause");
				//bs_stop();
				var attr=$(".bs_slide:nth-child("+(current_index+1)+")");
				var size=bs_get_imagesize(attr);
				var width=option.width;
				var height=option.height;
				handle.append("<div id='bs_lightbox'><div id='bs_lightbox_overlay'></div><div id='bs_sublightbox'><div id='bs_lightbox_control_close'></div><div id='bs_lightbox_control_prev' class='bs_lcontrol'></div><div id='bs_lightbox_control_next' class='bs_lcontrol'></div><div id='bs_lviewport'></div></div></div>");
				handle.find("#bs_lightbox").append("<div id='bs_lightbox_thumb' class=''><div id='bs_subboard'><div id='bs_thumb_container'></div></div></div>");				
				handle.find(".bs_slide").each(function(i)
				{
					var src=$(this).find(".bs_image").attr("data-src");
					if(i==current_index)
					  handle.find("#bs_thumb_container").append("<div class='bs_thumb active'><div class='bs_subthumb'><img class='bs_thumb_img' src='"+$(this).find(".bs_image").attr("src")+"' data-src='"+src+"'/></div></div>");
					else
					  handle.find("#bs_thumb_container").append("<div class='bs_thumb'><div class='bs_subthumb'><img class='bs_thumb_img' src='"+$(this).find(".bs_image").attr("src")+"' data-src='"+src+"'/></div></div>");
					
				});
				handle.find("#bs_thumb_container").css("width",54*length);
				handle.find("#bs_lviewport").html(attr.html());
				handle.find("#bs_sublightbox .bs_layer").remove();
				if(bs_isIE()!=false&&bs_isIE()<9)
				{
					handle.find("#bs_sublightbox").css("width",width).css("height",height).css("marginLeft",(-width/2)).css("marginTop",-height/2).css("opacity",0);
					handle.find("#bs_sublightbox").animate({
						"opacity":1,
					},
					{
						duration:400,
						easing:"easeOutSine"
					});
				}
				else
				{
					handle.find("#bs_sublightbox").css("width",width).css("height",height).css("marginLeft",-width/2).css("marginTop",-height/2).css("opacity",0).scale(0.5);
					handle.find("#bs_sublightbox").animate({
						"opacity":1,
						"scale":1,
					},
					{
						duration:400,
						easing:"easeOutSine"
					});
				}
/*				handle.find(".bs_thumb").find(".bs_thumb_img").greyScale({
				  // call the plugin with non-defult fadeTime (default: 400ms)
				  fadeTime: 500,
				  reverse: false
				});*/
			}
		}
		//seven lightbox carousel refresh
		function bs_lightbox_refresh(flag)
		{
			var cache=handle.find("#bs_thumb_container");
			var board=handle.find("#bs_subboard");
			var width=cache.width();
			var left=Math.abs(parseInt(board.css("marginLeft")));
			var index=cache.find(".active").index();
			if(width<$(window).width()&&typeof(flag)!='undefined') return false;			
			if(flag==0)
			{
				if(left>index*54)
				{
					board.animate({"marginLeft":-54*index},{duration:200,easing:"easeOutSine"});
				}
				else if(width-$(window).width()-left<width-(length-index)*54)
				{
					var offset=-54*index;
					if(54*index+$(window).width()>width) offset=$(window).width()-width;
					board.animate({"marginLeft":offset},{duration:200,easing:"easeOutSine"});
				}
				if(index==length-1)
				{
					board.animate({"marginLeft":-width+$(window).width()},{duration:200,easing:"easeOutSine"});		
				}
			}
			else if(flag==1)
			{
				if(width-(length-index-1)*54-$(window).width()>left)
				{
					board.animate({"marginLeft":-(width-(length-index-1)*54-$(window).width())},{duration:200,easing:"easeOutSine"});
				}
				else if(!((index+1)*54-$(window).width()<left&&index*54>left))
				{
					var offset=$(window).width()-(index+1)*54;
					if(offset>0) offset=0;
					board.animate({"marginLeft":offset},{duration:200,easing:"easeOutSine"});
				}
				
				if(index==0)
				{
					board.animate({"marginLeft":0},{duration:200,easing:"easeOutSine"});
				}
			}
			if(typeof(flag)=='undefined')
			{
				if(width<$(window).width())
				{
					board.css("marginLeft",0);
				}
				else
				{
					if(54*index+$(window).width()<width)	board.show();					
					else board.css("marginLeft",-width+$(window).width());
				}
			}
		}
		//swipe function
		function bs_swipe_function(e)
		{
			if(option.swipe==true&&mpflag==1)
			{
				var offsetx=offsety=0;
				var direction=-1;
				offsetx=e[0]-mp_temp[0];
				offsety=e[1]-mp_temp[1];
				mpflag=0;
				if(Math.abs(offsetx)>2||Math.abs(offsety)>2)
				{					
					switch(sd_flag)
					{
						//horizontal swipe
						case 1:
							if(offsetx>2) 
								direction=0;
							else if(offsetx<-2)
								direction=1;
							else
							{
								sd_flag=0;
								handle.find(".bs_operate").css("marginLeft",0).css("marginTop",0);
								handle.find("#bs_prev").css("left","-100%").css("top","0");
								handle.find("#bs_next").css("left","100%").css("top","0");
							}
							//lock the key
							if(direction>-1)
							{
								lock=1;
								handle.find(".bs_operate").each(function(i){
									$(this).animate({
									"marginLeft":option.width-2*option.width*direction+"px",
									},
									{
										duration:800,
										easing:"easeOutSine",
										complete: function()
										{
											if(i==2)
											{
												current_index=(direction==1)?(current_index+1)%length:(current_index==0)?length-1:current_index-1;;
												bs_swipe_end();
											}
										}
									});
								});
							}
						break;
						//vertical swipe
						case 2:
							if(offsety>2) 
								direction=0;
							else if(offsety<-2)
								direction=1;
							else
							{
								sd_flag=0;
								handle.find(".bs_operate").css("marginLeft",0).css("marginTop",0);
								handle.find("#bs_prev").css("left","-100%").css("top","0");
								handle.find("#bs_next").css("left","100%").css("top","0");
							}
							//lock the key
							if(direction>-1)
							{
								lock=1;
								handle.find(".bs_operate").each(function(i){
									$(this).animate({
									"marginTop":option.height-2*option.height*direction+"px",
									},
									{
										duration:800,
										easing:"easeOutSine",
										complete: function()
										{
											if(i==2)
											{
												current_index=(direction==1)?(current_index+1)%length:(current_index==0)?length-1:current_index-1;;
												bs_swipe_end();
											}
										}
									});
								});
							}
						break;
					}
				}
				else
				{
					sd_flag=0;
					handle.find(".bs_operate").css("marginLeft",0).css("marginTop",0);
					handle.find("#bs_prev").css("left","-100%").css("top","0");
					handle.find("#bs_next").css("left","100%").css("top","0");
					if(a_flag==1) bs_start();
				//	bs_lightbox_setup();
				}
			}
		}
		//swipe end process
		function bs_swipe_end()
		{
			bs_set_current_slide(current_index);
			handle.find(".bs_operate").css("marginLeft",0).css("marginTop",0);
			handle.find("#bs_prev").css("left","-100%").css("top","0").css("marginLeft",0).css("marginTop",0);
			handle.find("#bs_next").css("left","100%").css("top","0").css("marginLeft",0).css("marginTop",0);
			//adjust carousel Pos
			handle.find(".bs_index").removeClass("active");
			handle.find(".carousel").removeClass("active");
			handle.find(".bs_index:nth-child("+(current_index+2)+")").addClass("active");
			handle.find(".carousel:nth-child("+(current_index+1)+")").addClass("active");
			target_index=current_index;
			if(option.carousel!=false)
			{
				c_flag=0;
				bs_adjust_carousel(current_index);
			}
			bs_respond();
			lock=0;
			sd_flag=0;
			if(a_flag==1) bs_start();
			bs_layer_animate();
			/*bs_kenburn();*/
		}
		function bs_lightbox_slide(index)
		{
			if(handle.find("#bs_sublightbox_temp").length>0) return false;
			var width=option.width,height=option.height;
			var attr=$(".bs_slide:nth-child("+(index+1)+")");
			handle.find("#bs_sublightbox").append("<div id='bs_sublightbox_temp'></div>");
			handle.find("#bs_sublightbox_temp").html(attr.html());
			handle.find("#bs_sublightbox_temp").find(".bs_image").css("width",option.width);
			handle.find("#bs_sublightbox_temp").css("marginLeft",-80).css("opacity",0);
			handle.find(".bs_thumb").removeClass("active");
			handle.find(".bs_thumb:nth-child("+(index+1)+")").addClass("active");
			handle.find("#bs_sublightbox_temp").animate({
				'opacity':1,
				'marginLeft':"+=80px"
			},
			{
				duration:400,
				easing:"easeOutSine"
			});
			handle.find("#bs_lviewport").animate({
				'opacity':0,
				'marginLeft':"+=80px"
			},
			{
				duration:400,
				easing:"easeOutSine",
				complete:function()
				{
					handle.find("#bs_lviewport").remove();					
					handle.find("#bs_sublightbox_temp").stop().css("marginLeft","").css("marginTop","").attr("id","bs_lviewport");
				}
			});
		}
		//linear automate function
		function bs_linear_automate()
		{
		  var rwidth=handle.find("#lp_ct").width();
		  /* full width progress bar */
		  if(option.skin=='transformer') rwidth-=200;
		  t_val+=parseInt((rwidth-10)/(20*option.interval));
		  if(t_val>=parseInt(rwidth-10))
		  {
			  bs_next();
		  }
		  handle.find("#lprogress").css("width",t_val);	  
		}
		//circle automate function
		function bs_index_automate()
		{
		   t_val+=5000/(option.interval*1000);
		   if(t_val>=100)
		   {
			   bs_stop();
			   bs_next();
		   }
		   handle.find('.cprogress').val(Math.ceil(t_val)).trigger('change');
		}
		//move to the previous slide
		function bs_current()
		{
			c_flag=0;
			if(option.repeat_mode==false)
			{
			  if(current_index>0)
				bs_animation(current_index-1);
			  else
				bs_stop();
			}
			else
			{
				if(current_index==0) 
					bs_animation(length-1);
				else
					bs_animation(current_index-1);
			}
		}
		//move to the next slide
		function bs_next()
		{
			c_flag=0;
			if(option.repeat_mode==false)
			{
			  if(current_index<length-1)
				bs_animation(current_index+1);
			  else
				bs_stop();
			}
			else
				bs_animation((current_index+1)%length);						
		}
		//move to prev carousel
		function bs_prev_carousel()
		{
			  if(100*length<option.width)	return false;
			  var tb=parseInt(option.width/160);
			  var temp=Math.abs(Math.ceil(parseInt(handle.find("#bs_hviewport").css("left"))/160));
			  if(temp>=tb)
			  {
				 handle.find("#bs_hviewport").animate({
					 "left":-100*(temp-tb),													 
				 },
				 {
					 duration:200,
					 easing:"swing"
				 });
			 }
			 else
			 {
				  handle.find("#bs_hviewport").animate({
					 "left":"0px",													 
				 },
				 {
					 duration:200,
					 easing:"swing"
				 });
			}	  
		}
		//move to next carousel
		function bs_next_carousel()
		{
			  if(100*length<option.width)	  return false;
			  var tb=parseInt(option.width/160);
			  var temp=Math.abs(Math.ceil(parseInt(handle.find("#bs_hviewport").css("left"))/160));
			  if(temp<(length-(tb*2)))
			  {
				 handle.find("#bs_hviewport").animate({
					 "left":-100*(temp+tb),													 
				 },
				 {
					 duration:400,
					 easing:"swing"
				 });
			 }
			 else
			 {
				  handle.find("#bs_hviewport").animate({
					 "left":-(handle.find("#bs_hviewport").width()-option.width)+"px",																			 		  
				  },
				  {
					 duration:400,
					 easing:"swing"
				  });
			 }
		}
		//responsive screen
		function bs_respond()
		{
			var owidth=parseInt(handle.attr("o-width"));
			var rwidth=$(window).width();
			if(option.fullwidth)	
				option.width=rwidth;			
			else
			{
				if(rwidth>400&&rwidth<=owidth)
				{
					option.width=(option.skin=='sharp'||option.skin=='clean')?rwidth-20:rwidth-40;
				}
				else if(rwidth<400)
				{
					option.width=(option.fullwidth)?400:380;
				}
				else if(rwidth>owidth)	option.width=owidth;
			}
			/* vertical carousel */
			if(option.width>600&&option.skin=='transformer')
				handle.find(".bs_vcarousel").show();
			else
				handle.find(".bs_vcarousel").hide();
			//carousel refresh
			//bs_carousel_refresh();
			bs_lightbox_refresh();
			//set up the resized width/height
			var o_ftsize=handle.attr("o-font");
			var ratio=option.width/owidth;
			option.height=option.width/rate;
			font_size=(o_ftsize*ratio<10)?10:o_ftsize*ratio;
			handle.css("width",option.width).css("height",option.height);
			handle.find(".bs_caption").css("font-size",font_size);
			handle.find("#bs_sublightbox").css("width",option.width+8).css("height",option.height+8).css("marginLeft",(-option.width/2)-4).css("marginTop",-option.height/2);
			handle.find(".bs_operate").each(function(i)
			{
				var prev=(current_index-1<0)?length-1:current_index-1;
				var next=(current_index+1)%length;
				if(current_index!=target_index) next=target_index;
				var index=[prev,current_index,next];
				var name_arr=["#bs_prev","#bs_current","#bs_next"];
				var temp=bs_get_imagesize(handle.find(".bs_slide:nth-child("+parseInt(index[i]+1)+")").find(".bs_image"));
				var temp_rate=temp.width/temp.height;
				/*if(rate>=temp_rate)
					handle.find(name_arr[i]).find(".bs_image").css("height","").css("width",option.width);
				else 
					handle.find(name_arr[i]).find(".bs_image").css("width","").css("height",option.height);*/
			});
		}
		//animation function
		function bs_animation(arg)
		{
			//while animation is going on or same index
			if(lock==1||current_index==arg) return false;
			//main func
			lock=1;
			option.onanimstart();
			bs_stop();
			target_index=arg;
			var cache=handle.find("#bs_next");
			var cache1=handle.find(".bs_slide:nth-child("+(target_index+1)+")");
			cache.html(cache1.html());
			// setting up slider variables
			var qtype=(cache1.attr("qtype")!=undefined)?cache1.attr("qtype"):0;
			var kzoom=(cache1.attr("kzoom")!=undefined)?cache1.attr("kzoom"):1;
			var kposx=(cache1.attr("kposx")!=undefined)?cache1.attr("kposx"):0;
			var kposy=(cache1.attr("kposy")!=undefined)?cache1.attr("kposy"):0;
			// replace type of animation into others from blur
			if(qtype==1&&kzoom==1) qtype=4;
			cache.attr("kzoom",kzoom);
			cache.attr("kposx",kposx);
			cache.attr("kposy",kposy);
			cache.attr("qtype",qtype);
			cache.find(".bs_image").addClass("zoompa"+qtype);
			if(!cache.find(".bs_image").hasClass("active"))
			{
				handle.find("#bs_current").prepend("<img class='bs_load' src='img/skin/"+option.skin+"_loader.gif' />");
				cache.find(".bs_image").on('load',function()
				{
					var code=$(this).parents(".bs_operate").attr("kzoom");
					// kenburn images set
					if(code==1)
						$(this).attr("width",option.width);
					else if(code==2)
						$(this).attr("width",$(this).width()).css("margin-left",-parseInt($(this).width()-option.width)/2).css("margin-top",-parseInt($(this).height()-option.height)/2);

					$(this).addClass("active");
					handle.find("#bs_current").find(".bs_load").remove();
					bs_animate_init();
				});
			}
			else{
				var code=handle.find("#bs_next").attr("kzoom");
				// kenburn images set
				if(code==1)
					handle.find("#bs_next").find(".bs_image").attr("width",option.width);
				else if(code==2)
					handle.find("#bs_next").find(".bs_image").attr("width",handle.find("#bs_next").find(".bs_image").width()).css("margin-left",-parseInt(handle.find("#bs_next").find(".bs_image").width()-option.width)/2).css("margin-top",-parseInt(handle.find("#bs_next").find(".bs_image").height()-option.height)/2);
				bs_animate_init();			
			}
		}
		//animate initialization
		function bs_animate_init()
		{
			//resize the screen before animation
			bs_respond();			
			/* circle/carousel adjust */
			handle.find(".bs_index").removeClass("active");
			handle.find(".carousel").removeClass("active");
			handle.find(".bs_index:nth-child("+(target_index+2)+")").addClass("active");
			handle.find(".carousel:nth-child("+(target_index+1)+")").addClass("active");
			//adjust carousel Pos
			if(option.carousel!=false)	bs_adjust_carousel(current_index);
			clearInterval(kentimer);
			code=parseInt(Math.random()*8)+1;
			//layers disappear
			bs_layer_end_animate();
			//caption 
			//bs_caption_animate();
		}
		//when slider changes to other, layers come into the front
		function bs_layer_end_animate()
		{
			var length=handle.find("#bs_current").find(".bs_layer").length;
			if(length==0)
			{
					bs_2d_animate(1);
			}
			handle.find("#bs_current").find(".bs_layer").removeClass("animation_done").each(function(i){
				var endtype=$(this).attr("end-type");
				var delay=$(this).attr("end-delay");
				var animtime=$(this).attr("end-anim-time");
				var easing=$(this).attr("end-easing");
				var ox=$(this).attr("end-offsetx");
				var oy=$(this).attr("end-offsety");
				var zoom=$(this).attr("end-zoom");
				var endfilter=$(this).attr("end-filter-type");
				var rotate=$(this).attr("end-rotate");
				var opacity=$(this).attr("end-opacity");
				var filter_arr=['blur','sepia','invert','grayscale'];
				var suffix_arr=['%','px','px','px'];
				// default values;
				delay=(delay=="")?0:delay;
				animtime=(animtime=="")?1000:animtime;
				easing=(easing=="")?"easeOutSine":easing;
				ox=(ox=="")?0:ox;
				oy=(oy=="")?0:oy;
				zoom=(zoom=="")?1:zoom;
				endfilter=(endfilter=="")?1:endfilter;
				rotate=(rotate=="")?0:rotate;
				opacity=(opacity=="")?0:opacity;
				var a_code=0;
				a_code=(option.animation==0)?(parseInt(Math.random()*5)+1):option.animation;
				if(endtype!="0"&&endtype!="")
				{
					$(this).clearQueue().stop().delay(delay).animate({
						"marginLeft":"+="+ox+"px",
						"marginTop":"+="+oy+"px",
						"opacity":opacity,
						"zoom": zoom,
						"rotate": rotate+"deg"
					},
					{
						duration:animtime,
						easing:easing,
						complete: function()
						{	
							//animation is done
							$(this).addClass("animation_done");
							if(handle.find("#bs_current").find(".animation_done").length==length) bs_2d_animate(1);
						}
					});	
				}
			});
		}
		//caption animate
		function bs_caption_animate()
		{
			var anim_array=[[-1,0],[1,0],[0,-1],[0,1]];
			var a_code,caption;
			a_code=handle.find(".bs_slide:nth-child("+(target_index+1)+")").attr("data-animation");
			caption=handle.find(".bs_slide:nth-child("+(current_index+1)+")").attr("data-caption");

			if(typeof(a_code)=='undefined')
			{
				a_code=(option.animation==0)?(parseInt(Math.random()*5)+1):option.animation;
			}
			else
				a_code=parseInt(a_code);
			
			if(typeof(caption)=='undefined'||caption=='') 
			{
				//animation is done
				handle.find(".bs_caption").hide();
				bs_2d_animate(a_code);
			}
			else
			{
				//Initialization for Layer
				handle.find("#bs_current .bs_caption").css("marginLeft",0).css("marginBottom",0).animate({
					"marginLeft":anim_array[option.caption_animation][0]*140+"px",
					"marginBottom":anim_array[option.caption_animation][1]*60+"px",
					"opacity":0,
				},
				{
					duration:600,
					easing:"easeOutSine",
					complete: function()
					{	
						//animation is done
						handle.find(".bs_caption").hide();
						if(a_code<=302) 
							bs_2d_animate(a_code);
						else
							bs_3d_animate(a_code-302);
					}
				});		
			}
		}
		//layer animate emerge
		function bs_layer_animate()
		{
				bs_kenburn();
				var length=handle.find("#bs_current").find(".bs_layer").length;
				if(length==0)
				{
					//animation is done
					lock=0;
					option.onanimend();	
					if(option.responsive==true)	bs_respond();
					handle.find("#bs_next .bs_caption").stop();
					//if autoplay is on
					if(a_flag==1)	bs_start();
				}
				handle.find("#bs_current").find(".bs_layer").removeClass("animation_done").each(function(i){
					var starttype=$(this).attr("end-type");
					var delay=$(this).attr("start-delay");
					var animtime=$(this).attr("start-anim-time");
					var easing=$(this).attr("start-easing");
					var ox=$(this).attr("start-offsetx");
					var oy=$(this).attr("start-offsety");
					var zoom=$(this).attr("start-zoom");
					var startfilter=$(this).attr("start-filter-type");
					var rotate=$(this).attr("start-rotate");
					var opacity=$(this).attr("start-opacity");

					var filter_arr=['blur','sepia','invert','grayscale'];
					var suffix_arr=['%','px','px','px'];
					// default values;
					delay=(delay=="")?0:delay;
					animtime=(animtime=="")?1000:animtime;
					easing=(easing=="")?"easeOutSine":easing;
					ox=(ox=="")?0:ox;
					oy=(oy=="")?0:oy;
					zoom=(zoom=="")?1:zoom;
					startfilter=(startfilter=="")?1:startfilter;
					rotate=(rotate=="")?0:rotate;
					opacity=(opacity=="")?1:opacity;
					var a_code=0;
					a_code=(option.animation==0)?(parseInt(Math.random()*5)+1):option.animation;
					if(starttype!="")
					{
						$(this).stop().clearQueue().delay(delay).animate({
							"marginLeft":"+="+ox+"px",
							"marginTop":"+="+oy+"px",
							"opacity":opacity,
							"zoom": zoom,
							"rotate": rotate+"deg"
						},
						{
							duration:animtime,
							easing:easing,
							complete: function()
							{	
								//animation is done
								if(starttype=="1"){
									endtype=$(this).attr("end-type");
									delay=$(this).attr("end-delay");
									animtime=$(this).attr("end-anim-time");
									easing=$(this).attr("end-easing");
									ox=$(this).attr("end-offsetx");
									oy=$(this).attr("end-offsety");
									zoom=$(this).attr("end-zoom");
									endfilter=$(this).attr("end-filter-type");
									rotate=$(this).attr("end-rotate");
									opacity=$(this).attr("end-opacity");
									delay=(delay=="")?0:delay;

									animtime=(animtime=="")?1000:animtime;
									easing=(easing=="")?"easeOutSine":easing;
									ox=(ox=="")?0:ox;
									oy=(oy=="")?0:oy;
									zoom=(zoom=="")?1:zoom;
									startfilter=(startfilter=="")?1:startfilter;
									rotate=(rotate=="")?0:rotate;
									opacity=(opacity=="")?0:opacity;

									$(this).delay(delay).animate({
										"marginLeft":"+="+ox+"px",
										"marginTop":"+="+oy+"px",
										"opacity":opacity,
										"zoom": zoom,
										"rotate": rotate+"deg"
									},
									{
										duration:animtime,
										easing:easing,
										complete: function()
										{	
											//animation is done
											$(this).stop().clearQueue().addClass("animation_done");
											if(handle.find("#bs_current").find(".animation_done").length==length)
											{
												//animation is done
												lock=0;
												option.onanimend();	
												if(option.responsive==true)	bs_respond();
												handle.find("#bs_next .bs_caption").stop();
												//if autoplay is on
												if(a_flag==1)	bs_start();
											}
										}
									});	
								}
								else{
									$(this).addClass("animation_done");
									$(this).stop();
								}
								
								if(handle.find("#bs_current").find(".animation_done").length==length)
								{
									//animation is done
									lock=0;
									option.onanimend();	
									if(option.responsive==true)	bs_respond();
									handle.find("#bs_next .bs_caption").stop();
									//if autoplay is on
									if(a_flag==1)	bs_start();
								}
							}
						});	
					}
			});
		}
		//caption animate emerge
		function bs_caption_end_animate()
		{

			//if(code>4) handle.find(".bs_operate").find(".bs_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate); 
			bs_kenburn();
			var anim_array=[[-1,0],[1,0],[0,-1],[0,1]];
			var a_code;
			var opacity;
			//check if browser is ie
			if(bs_isIE()<9&&bs_isIE()!=false)
				opacity=0.4;
			else
				opacity=1;
			//Initialization for Layer
			caption=handle.find(".bs_slide:nth-child("+(current_index+1)+")").attr("data-caption");
			if(typeof(caption)=='undefined'||caption=='') 
			{
				//animation is done
				lock=0;
				option.onanimend();	
				if(option.responsive==true)	bs_respond();
				handle.find("#bs_next .bs_caption").stop();
				//if autoplay is on
				if(a_flag==1)	bs_start();
			}
			else
			{
				handle.find(".bs_caption").show();
				handle.find("#bs_current .bs_caption").css("marginLeft",anim_array[option.caption_animation][0]*140).css("marginBottom",anim_array[option.caption_animation][1]*60).css("opacity",0).animate({
					"marginLeft":"0px",
					"marginBottom":"0px",
					"opacity":opacity,
				},
				{
					duration:300,
					easing:"easeOutSine",
					complete: function()
					{	
						//animation is done
						lock=0;
						option.onanimend();	
						if(option.responsive==true)	bs_respond();
						handle.find("#bs_next .bs_caption").stop();
						//if autoplay is on
						if(a_flag==1)	bs_start();
					}
				});	
			}
		}
		// kenburn animation
		function bs_kenburn()
		{
			var cache=handle.find("#bs_current").find(".bs_image");
			var ctx;
			var offset=0;
			var toff=(code<5)?0:200;
			var awidth=[0,0,0,0,0,400,400,400,400,400];
			var index=0;
			var kzoom=parseInt(handle.find("#bs_current").attr("kzoom"));
			var qtype=parseInt(handle.find("#bs_current").attr("qtype"));
			var kposx=parseInt(handle.find("#bs_current").attr("kposx"));
			var kposy=parseInt(handle.find("#bs_current").attr("kposy"));
			var posx=(parseInt(cache.width()-option.width)/1000).toFixed(1);
			var posy=-(parseInt(cache.height()-option.height)/1000).toFixed(1);
			var stepx=kposx/1000;
			var stepy=kposy/1000;
			var blur_index=0;
			var ben_height=handle.find("#bs_current").find(".bs_image").height();
			var anim_arr=['sepia','invert','grayscale'];
			handle.find(".bs_canvas").remove();

			if(bs_isIE()!=false&&bs_isIE()<9)
			{
				var oarr=[[-100,0],[-200,0],[-200,-200/rate],[-80,-200/rate],[-120,-80/rate],[-200,0],[-200,-200/rate],[0,-200/rate],[-80,-200/rate],[-80,-80/rate]];
				var toffset=(code<5)?400:-400;
				$("<img class='bs_canvas' width='"+(option.width+awidth[code])+"' src='"+cache.attr("src")+"'/>").insertAfter(cache);
				handle.find("#bs_current .bs_canvas").css("marginLeft",-toff).css("marginTop",-toff/rate).animate({width:"+="+toffset/4,"marginLeft":"+="+oarr[code][0]/12,"marginTop":"+="+oarr[code][1]/(rate*12)},{duration:5000,easing:"easeOutSine"});
			}
			else
			{
					// prepare canvas
					$("<canvas class='bs_canvas' width='"+option.width+"' height='"+option.height+"'></canvas>").insertAfter(cache);
					ctx=handle.find(".bs_canvas")[0].getContext("2d");
					if(qtype==1)
					{
						if(kzoom==2)
							ctx.filter = 'blur(20px)';
						else 
							qtype=4;
					}
					else if(qtype>1){
						ctx.filter =anim_arr[qtype-2]+'(100%)';
					}
					//draw canvas
					if(kzoom==1)
						ctx.drawImage(cache[0],0,0,option.width,ben_height);	
					else if(kzoom==2)
						ctx.drawImage(cache[0],-parseInt(cache.width()-option.width)/2,-parseInt(cache.height()-option.height)/2,cache.width(),cache.height());
					function clear() {
						// Clear the canvas
						ctx.save();
						ctx.globalAlpha = 1;
						ctx.fillStyle = "#fff";
						ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
						ctx.restore();
					}	
					function update()
					{
						blur_index+=0.1;
						if(index>90)
						{
							index+=Math.sin(index*3.14/180);
						}
						else index++;
						
						if(index>180)
						{
							clearInterval(kentimer);
							return;
						}
						else if(kzoom==1)
						{
							/*if(inde>-10||-parseInt(cache.height()-option.height)/2+stepy*index>-10||cache.width()-posx-parseInt(cache.width()-option.width)/2+stepx*index<option.width||cache.height()-posy-parseInt(cache.height()-option.height)/2+stepy*index<option.height)
							{
								clearInterval(kentimer);
								return;	
							}	*/
						}
						else if(kzoom==2)
						{
							if(-parseInt(cache.width()-option.width)/2+stepx*index>-10||-parseInt(cache.height()-option.height)/2+stepy*index>-10||cache.width()-posx-parseInt(cache.width()-option.width)/2+stepx*index<option.width||cache.height()-posy-parseInt(cache.height()-option.height)/2+stepy*index<option.height)
							{
								clearInterval(kentimer);
								return;	
							}
						}
						clear();
						if(qtype==1)
						{
							if(kzoom==2)
								ctx.filter = 'blur('+(20-blur_index)+'px)';
							else 
								qtype=4;
						}
						else if(qtype>1){
							ctx.filter =anim_arr[qtype-2]+'('+(100-blur_index*5)+'%)';
						}
						if(kzoom==1){
							//calculate image rate for canvas drawing
							ctx.drawImage(cache[0],-index/2-(option.width-kposx)/2000*index,-index/2-(option.height-kposy)/2000*index,option.width+index+(option.width-kposx)/4000*index,handle.find("#bs_current").find(".bs_image").height()+index+(option.height-kposy)/4000*index);	
							//ctx.filter='sepia('+(100-blur_index*5)+'%)';							
						}
						else if(kzoom==2){
							ctx.drawImage(cache[0],-parseInt(cache.width()-option.width)/2+stepx*index,-parseInt(cache.height()-option.height)/2+stepy*index,cache.width()-posx*index,cache.height()-posy*index);
							//ctx.filter='blur('+(20-blur_index)+'px)';
						}
					}
					kentimer=setInterval(update,20);
			}
		}
		/* DOM event processing */
		$(document).ready(function(){
			// carousel mouse effect
			$("body").on("mousemove","#bs_carousel",function(event){
				// get ready for offset
				var original_offset=handle.find("#bs_carousel").width()-handle.find("#bs_tviewport").width();
				if(thumb_rate<0) return;
				// offset moving
				var ol=parseInt(handle.find("#bs_carousel").offset().left);
				var clientX=parseInt(ol-event.clientX+50)*thumb_rate;
				$(".bs_title").html(ol-event.clientX);
				if(clientX>0) clientX=0;
				else if(clientX<original_offset) clientX=original_offset;
				handle.find("#bs_tviewport").css("margin-left",clientX);
			});
			/* pause on hover effect */
			handle.mouseover(function()
			{
				if(option.pause_on_hover)	bs_pause();
				// Left+Right Button Show
				handle.find(".bs_nav").show();
				// Carousel Bar Show
				if(option.skin=='ios7'){
					$("#bs_carousel").css("opacity",1).show();
				}
			}).mouseleave(function()
			{
				if(option.pause_on_hover&&a_flag==1)
					bs_start();
				handle.find(".bs_nav").hide();
				if(option.skin=='ios7')
				{
					handle.find("#bs_carousel").hide();
				}
			});
			handle.find("#bs_shadow").mousemove(function(){
				handle.find("#bs_carousel").hide();
			});
			//mousemove
			handle.find('#bs_viewport').on('mousedown',function(e){									  
				if(option.swipe==true&&lock==0) 														  
				{
					mp_temp=[e.pageX,e.pageY];
					mpflag=1;
					bs_respond();
					bs_stop();
					//$(this).addClass("cursor_down");
					code=parseInt(Math.random()*8)+1;
					clearInterval(kentimer);
					// when mousedown hide
					if(option.skin=='ios7'){
						handle.find("#bs_lbox").hide();
						handle.find(".bs_nav").hide();
						handle.find("#bs_carousel").hide();
					}
				}															  
			}).mousemove(function(e){	
				 if(mpflag==1&&lock==0)
				 {
					var offsetx=offsety=0;
					offsetx=e.pageX-mp_temp[0];
					offsety=e.pageY-mp_temp[1];

					//set swipe direction
					if(sd_flag==0)
					{
						sd_flag=(Math.abs(offsetx)>=Math.abs(offsety))?1:2;
						if(sd_flag==2)
						{
							handle.find("#bs_prev").css("left","0").css("top","-100%");
							handle.find("#bs_next").css("left","0").css("top","100%");
						}
					}
					//make proper action
					if(sd_flag==1)
						handle.find(".bs_operate").css("marginLeft",offsetx);
					else if(sd_flag==2)
						handle.find(".bs_operate").css("marginTop",offsety);
				 }
			}).mouseup(function(e){
				$(this).removeClass("cursor_down");
				if(lock==1) return;
				// when mousedown hide
				if(option.skin=='ios7'){
					handle.find("#bs_lbox").show();
					handle.find(".bs_nav").show();
					handle.find("#bs_carousel").show();
				}
				bs_swipe_function(new Array(e.pageX,e.pageY));
			}).mouseleave(function(e)
			{
				$(this).removeClass("cursor_down");				
				if(lock==1) return;
				bs_swipe_function(new Array(e.pageX,e.pageY));
			});
			//touch event for swipe
			handle.find("#bs_viewport").on('touchstart',function(e)
			{
				if(option.swipe==true&&lock==0) 														  
				{
					 mp_temp=[e.originalEvent.touches[0].pageX,e.originalEvent.touches[0].pageY];
					 mpflag=1;
					 bs_respond();
					 bs_stop();
					 code=parseInt(Math.random()*8)+1;
					 clearInterval(kentimer);
				}				
			}).on('touchmove',function(e)
			{
				 if(mpflag==1&&lock==0)
				 {
					 //kenburn
					if(code>4) 
					{
						//handle.find(".bs_operate:not(#bs_current)").find(".bs_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate);
					}
					
					var offsetx=offsety=0;
					offsetx=e.originalEvent.changedTouches[0].pageX-mp_temp[0];
					offsety=e.originalEvent.changedTouches[0].pageY-mp_temp[1];
					//set swipe direction
					if(sd_flag==0)
					{
						sd_flag=(Math.abs(offsetx)>Math.abs(offsety))?1:2;
						if(sd_flag==2)
						{
							handle.find("#bs_prev").css("left","0").css("top","-100%");
							handle.find("#bs_next").css("left","0").css("top","100%");
						}
					}
					//make proper action
					if(sd_flag==1)
						handle.find(".bs_operate").css("marginLeft",offsetx);
					else if(sd_flag==2)
						handle.find(".bs_operate").css("marginTop",offsety);
				 }
			}).on('touchend',function(e)
			{
				if(lock==1) return;
				bs_swipe_function(new Array(e.originalEvent.changedTouches[0].pageX,e.originalEvent.changedTouches[0].pageY));				
			});
			//navigation button
			$("body").on("click","#bs_bleft",bs_current);
			$("body").on("click","#bs_bright",bs_next);
			$("body").on("click","#left_btn",bs_current);
			$("body").on("click","#right_btn",bs_next);
			//lightbox 
			handle.on('click','#bs_lbox',function(){bs_lightbox_setup();});
			//preview slide event
			handle.on('mouseover',".bs_index",function(){ bs_thumb_preview($(this).index());});	
			//bullet click
			handle.on("click",".bs_index",function(){;bs_animation($(this).index()-1);});
			handle.on("click",".carousel",function(){	c_flag=1; bs_animation($(this).index(),1);});
			//hide slide-preview
			handle.on("mouseleave","#bs_bullet",function(){ bs_thumb_hide();});
			handle.on("mousemove","#bs_bleft",function(){ bs_thumb_hide();});
			handle.on("mousemove","#bs_bright",function(){ bs_thumb_hide();});
			handle.on('click','#bs_lightbox_control_next',function()
			{
				var index=$(".bs_thumb.active").index();	
				index=(index+1)%length;
				bs_lightbox_slide(index);
				bs_lightbox_refresh(1);				
			});
			handle.on('click','#bs_lightbox_control_prev',function()
			{
				var index=$(".bs_thumb.active").index();	
				if(index==0)
					index=length-1;
				else
					index-=1;
				bs_lightbox_slide(index);
				bs_lightbox_refresh(0);
			});
			handle.on('mouseout','#bs_lightbox_thumb',function()
			{
				var cache=handle.find("#bs_lightbox_thumb");
				cache.removeClass("active");
			});
			handle.on('mouseover','#bs_lightbox_thumb',function()
			{
				var cache=handle.find("#bs_lightbox_thumb");
				cache.addClass("active");
			});
			handle.on('click','#bs_lightbox_control_close',function()
			{
				handle.find("#bs_lightbox").animate({
					"opacity":0,
				},
				{
					duration:200,
					easing:"easeOutSine",
					complete:function()
					{
						if(a_flag==1) bs_start();
						handle.find("#bs_lightbox").remove();  
					}
				});
			});
			handle.on('click','.bs_thumb',function(){
				var index=$(this).index();	
				bs_lightbox_slide(index);							  
			});
			handle.on('mousemove','#bs_lightbox_thumb',function(e)
			{
				var cache=handle.find("#bs_subboard");
				var width=handle.find("#bs_thumb_container").width();
				if(width<$(window).width()) return false;
				cache.css("marginLeft",-e.pageX*((width-$(window).width())/$(window).width()));
			});
			handle.on('touchstart','#bs_lightbox_thumb',function(e)
			{
				mp_temp=e.originalEvent.touches[0].pageX;
				mpflag=1;
			});
			handle.on('touchmove','#bs_lightbox_thumb',function(e)
			{
				var cache=handle.find("#bs_subboard");
				var offset=e.originalEvent.changedTouches[0].pageX-mp_temp;
				var left=parseInt(cache.css("marginLeft"));
				cache.css("marginLeft",left+offset);
			});
			handle.on('touchend','#bs_lightbox_thumb',function(e)
			{
				var cache=handle.find("#bs_subboard");
				var left=parseInt(cache.css("marginLeft"));
				if(left>0) cache.animate({marginLeft:0},{duration:200,easing:"easeOutSine"});
				else if(left<$(window).width()-$(this).width()) cache.animate({marginLeft:$(window).width()-$(this).width()},{duration:200,easing:"easeOutSine"});
			});
			//lightbox close
			handle.on('click','#bs_lightbox_control_close',function()
			{
				handle.find("#bs_lightbox").animate({
					"opacity":0,
				},
				{
					duration:200,
					easing:"easeOutSine",
					complete:function()
					{
						if(a_flag==1) bs_start();
						handle.find("#bs_lightbox").remove();  
					}
				});
			});
			//show video play
			handle.on('click','.bs_play',function()
			{
				var temp=$(this).parent().find(".bs_image").attr("data-src");
				// Youtube checking
				if(temp.indexOf("youtube")<0)
					$(this).parent().append("<iframe class='bs_video' src='"+temp+"&autoplay=1"+"'></iframe>");
				else
					$(this).parent().append("<iframe class='bs_video' src='"+temp+""+"'></iframe>");
				bs_pause();			
			});
			// play/pause button
			handle.on("click",".bs_a_play",function(){
				  if(handle.find(".bs_a_play").hasClass("bs_a_pause"))
				  {
						handle.find(".bs_a_play").removeClass("bs_a_pause");													
						a_flag=0;
						bs_pause();
				  }
				  else
				  {
						handle.find(".bs_a_play").addClass("bs_a_pause");													
						if(a_flag==0)
						{
							a_flag=1;						
							if(option.progressbar)
							 	bs_progressbar_setup();							 
						}
						a_flag=1;						
						bs_start();
				  }
			});
		});
	}
	/*!
	/**
	* Monkey patch jQuery 1.3.1+ to add support for setting or animating CSS
	* scale and rotation independently.
	* https://github.com/zachstronaut/jquery-animate-css-rotate-scale
	* Released under dual MIT/GPL license just like jQuery.
	* 2009-2012 Zachary Johnson www.zachstronaut.com
	*/		
	// Updated 2010.11.06
    // Updated 2012.10.13 - Firefox 16 transform style returns a matrix rather than a string of transform functions. This broke the features of this jQuery patch in Firefox 16. It should be possible to parse the matrix for both scale and rotate (especially when scale is the same for both the X and Y axis), however the matrix does have disadvantages such as using its own units and also 45deg being indistinguishable from 45+360deg. To get around these issues, this patch tracks internally the scale, rotation, and rotation units for any elements that are .scale()'ed, .rotate()'ed, or animated. The major consequences of this are that 1. the scaled/rotated element will blow away any other transform rules applied to the same element (such as skew or translate), and 2. the scaled/rotated element is unaware of any preset scale or rotation initally set by page CSS rules. You will have to explicitly set the starting scale/rotation value.
    
    function initData($el) {
        var _ARS_data = $el.data('_ARS_data');
        if (!_ARS_data) {
            _ARS_data = {
                rotateUnits: 'deg',
                scale: 1,
                rotate: 0
            };
            $el.data('_ARS_data', _ARS_data);
        }
        
        return _ARS_data;
    }
    
    function setTransform($el, data) {
        $el.css('transform', 'rotate(' + data.rotate + data.rotateUnits + ') scale(' + data.scale + ',' + data.scale + ')');
    }
    
    $.fn.rotate = function (val) {
        var $self = $(this), m, data = initData($self);
                        
        if (typeof val == 'undefined') {
            return data.rotate + data.rotateUnits;
        }
        
        m = val.toString().match(/^(-?\d+(\.\d+)?)(.+)?$/);
        if (m) {
            if (m[3]) {
                data.rotateUnits = m[3];
            }
            
            data.rotate = m[1];
            
            setTransform($self, data);
        }
        
        return this;
    };
    
    // Note that scale is unitless.
    $.fn.scale = function (val) {
        var $self = $(this), data = initData($self);
        
        if (typeof val == 'undefined') {
            return data.scale;
        }
        
        data.scale = val;
        
        setTransform($self, data);
        
        return this;
    };

    // fx.cur() must be monkey patched because otherwise it would always
    // return 0 for current rotate and scale values
    var curProxied = $.fx.prototype.cur;
    $.fx.prototype.cur = function () {
        if (this.prop == 'rotate') {
            return parseFloat($(this.elem).rotate());
            
        } else if (this.prop == 'scale') {
            return parseFloat($(this.elem).scale());
        }
        
        return curProxied.apply(this, arguments);
    };
    
    $.fx.step.rotate = function (fx) {
        var data = initData($(fx.elem));
        $(fx.elem).rotate(fx.now + data.rotateUnits);
    };
    
    $.fx.step.scale = function (fx) {
        $(fx.elem).scale(fx.now);
    };
    
    /*
	Starting on line 3905 of jquery-1.3.2.js we have this code:
	// We need to compute starting value
	if ( unit != "px" ) {
	self.style[ name ] = (end || 1) + unit;
	start = ((end || 1) / e.cur(true)) * start;
	self.style[ name ] = start + unit;
	}
	This creates a problem where we cannot give units to our custom animation
	because if we do then this code will execute and because self.style[name]
	does not exist where name is our custom animation's name then e.cur(true)
	will likely return zero and create a divide by zero bug which will set
	start to NaN.
	The following monkey patch for animate() gets around this by storing the
	units used in the rotation definition and then stripping the units off.
	*/
    
    var animateProxied = $.fn.animate;
    $.fn.animate = function (prop) {
        if (typeof prop['rotate'] != 'undefined') {
            var $self, data, m = prop['rotate'].toString().match(/^(([+-]=)?(-?\d+(\.\d+)?))(.+)?$/);
            if (m && m[5]) {
                $self = $(this);
                data = initData($self);
                data.rotateUnits = m[5];
            }
            
            prop['rotate'] = m[1];
        }
        
        return animateProxied.apply(this, arguments);
    };
	
	// Monkey patch jQuery 1.3.1+ css() method to support CSS 'transform'
    // property uniformly across Safari/Chrome/Webkit, Firefox 3.5+, IE 9+, and Opera 11+.
    // 2009-2011 Zachary Johnson www.zachstronaut.com
    // Updated 2011.05.04 (May the fourth be with you!)
    function getTransformProperty(element)
    {
        // Try transform first for forward compatibility
        // In some versions of IE9, it is critical for msTransform to be in
        // this list before MozTranform.
        var properties = ['transform', 'WebkitTransform', 'msTransform', 'MozTransform', 'OTransform'];
        var p;
        while (p = properties.shift())
        {
            if (typeof element.style[p] != 'undefined')
            {
                return p;
            }
        }
        
        // Default to transform also
        return 'transform';
    }
    
    var _propsObj = null;
    
    var proxied = $.fn.css;
    $.fn.css = function (arg, val)
    {
        // Temporary solution for current 1.6.x incompatibility, while
        // preserving 1.3.x compatibility, until I can rewrite using CSS Hooks
        if (_propsObj === null)
        {
            if (typeof $.cssProps != 'undefined')
            {
                _propsObj = $.cssProps;
            }
            else if (typeof $.props != 'undefined')
            {
                _propsObj = $.props;
            }
            else
            {
                _propsObj = {}
            }
        }
        
        // Find the correct browser specific property and setup the mapping using
        // $.props which is used internally by jQuery.attr() when setting CSS
        // properties via either the css(name, value) or css(properties) method.
        // The problem with doing this once outside of css() method is that you
        // need a DOM node to find the right CSS property, and there is some risk
        // that somebody would call the css() method before body has loaded or any
        // DOM-is-ready events have fired.
        if
        (
            typeof _propsObj['transform'] == 'undefined'
            &&
            (
                arg == 'transform'
                ||
                (
                    typeof arg == 'object'
                    && typeof arg['transform'] != 'undefined'
                )
            )
        )
        {
            _propsObj['transform'] = getTransformProperty(this.get(0));
        }
        
        // We force the property mapping here because jQuery.attr() does
        // property mapping with jQuery.props when setting a CSS property,
        // but curCSS() does *not* do property mapping when *getting* a
        // CSS property. (It probably should since it manually does it
        // for 'float' now anyway... but that'd require more testing.)
        //
        // But, only do the forced mapping if the correct CSS property
        // is not 'transform' and is something else.
        if (_propsObj['transform'] != 'transform')
        {
            // Call in form of css('transform' ...)
            if (arg == 'transform')
            {
                arg = _propsObj['transform'];
                
                // User wants to GET the transform CSS, and in jQuery 1.4.3
                // calls to css() for transforms return a matrix rather than
                // the actual string specified by the user... avoid that
                // behavior and return the string by calling jQuery.style()
                // directly
                if (typeof val == 'undefined' && jQuery.style)
                {
                    return jQuery.style(this.get(0), arg);
                }
            }

            // Call in form of css({'transform': ...})
            else if
            (
                typeof arg == 'object'
                && typeof arg['transform'] != 'undefined'
            )
            {
                arg[_propsObj['transform']] = arg['transform'];
                delete arg['transform'];
            }
        }
        
        return proxied.apply(this, arguments);
    };
})(jQuery);
