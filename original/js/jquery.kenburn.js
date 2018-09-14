// Kenburn Responsive Image Slider
// Date: 11/13/2013
// Author: Seven
// Copyright: All rights reserved to Seven

(function($)
{
	//slider object
	var object;
	//interface for seven slider
	$.fn.kenburnseven = function(options){
		 object=new kenburnseven({
			 handle:$(this),
			 option:options
		 });	
		return object;
	};
   	//main class kenburn
	function kenburnseven(arg)
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
		//initialization
		seven_init();
		//seven initialization
		//seven initialization
		function seven_init()
		{
			var width=option.width,height=option.height;
			//variable initialization
			pcolor='';
			lock=t_val=0;
			current_index=target_index=0;
			mp_flag=tp_flag=t_flag=a_flag=sd_flag=c_flag=0;
			thumb_width=0;
			length=handle.find(".seven_slide").length;
			//setup the original rate
			rate=option.width/option.height;
			//carousel viewport initialization
			handle.append("<div id='seven_shadow'><img src='"+option.path+"img/skin/"+option.skin+"_shadow.png'/></div>");
			handle.find("#seven_viewport").prepend("<div id='seven_prev' class='seven_operate'></div><div id='seven_current' class='seven_operate seven_animate'></div><div id='seven_next' class='seven_operate seven_animate'></div>");
			handle.find(".seven_slide").each(function(i)
			{
				var cache=$(this);
				var src=cache.attr("image-src");
				var caption=cache.attr("data-caption");
				var des=cache.attr("data-description");
				var video=cache.attr("video-src");
				var href=cache.attr("data-link");
				if(typeof(href)=='undefined') href="#";
				if(typeof(video)=='undefined') video="";
				cache.append("<img class='seven_image' src='"+src+"' data-src='"+video+"'/>");
				if(typeof(caption)!='undefined') cache.append("<div class='seven_caption'><div><a class='seven_title' href='"+href+"'>"+caption+"</a></div><div><a class='seven_des'>"+des+"</a></div></div>");
				if(video!="")
				{
					if(option.skin=='ios7'||option.skin=='starworld'||option.skin=='nature'||option.skin=='xmas'||option.fullwidth==true)		cache.append("<img class='seven_play' src='"+option.path+"img/skin/"+option.skin+"_play.png'/>");
					else	cache.append("<img class='seven_play' src='"+option.path+"img/skin/play.png'/>");
				}
				cache.find(".seven_image").load(function()
				{
					//image is fully loaded
					$(this).addClass("active");
				});
			});
			//functional initialization
			var pt=parseInt(handle.find(".seven_slide .seven_caption").css("font-size"));
			if(option.skin=='transformer') pt=50;
			else if(option.skin=='beach') pt=40;
	 		handle.css("width",width).css("height",height).attr("o-width",width).attr("o-height",height).attr("o-font",pt);
			rate=width/height;
			//prepare image slide show
			seven_set_current_slide(current_index,0);
			//smooth framerate
			$().framerate(15);
		}
		//set prev/current/next slides
		function seven_set_current_slide(current,init_flag)
		{
			var prev=(current-1<0)?length-1:current-1;
			var next=(current+1)%length;
			var index=[prev,current,next];
			var name_arr=["#seven_prev","#seven_current","#seven_next"];
			handle.find(".seven_operate").each(function(i)
			{
				//lazy loading
				var cache=handle.find(name_arr[i]);
				var cache1=handle.find(".seven_slide:nth-child("+(index[i]+1)+")");
				cache.html(cache1.html());
				if(!cache1.find(".seven_image").hasClass("active"))
				{
					cache.prepend("<img class='seven_load' src='"+option.path+"img/skin/"+option.skin+"_loader.gif' />");
					cache.find(".seven_image").load(function()
					{
						$(this).addClass("active");
						$(this).parent().find(".seven_load").remove();
						if(i==1&&init_flag==0)
							//start slider functions
							seven_setup();
					});
				}
			});	
			if(option.responsive)	seven_respond();
		}
		//set up the seven slide
		function seven_setup()
		{
			//skin setup
		    seven_skin_setup();			
			//setup for fullwidth
			if(option.fullwidth==true)
			{
				option.width = (window.innerWidth > screen.width) ? window.innerWidth : screen.width;
				handle.css("margin-left",0).css("width",option.width).css("height",option.height);
			}
			//setup for autoplay
			if(option.autoplay==true)
			{
				a_flag=1;
				seven_start();
			}
			else
			  	handle.find(".seven_a_play").addClass("seven_a_pause");
			//setup for progressbar
			if(option.progressbar==true)
			{
				if(seven_isIE()!=false&&seven_isIE()<9)	 option.progresstype='linear';
			    seven_progressbar_setup();
			}
			handle.find("#seven_hviewport").css("width",thumb_width*handle.find(".seven_slide").length);
			if(option.responsive==true)	seven_respond();
			//seven kenburn
			code=parseInt(Math.random()*8)+1;
			if(code>4) handle.find(".seven_operate").find(".seven_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate); 
			seven_kenburn();

		}
		//responsive screen
		function seven_respond()
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
				handle.find(".seven_vcarousel").show();
			else
				handle.find(".seven_vcarousel").hide();
			//carousel refresh
			seven_carousel_refresh();
			seven_lightbox_refresh();
			//set up the resized width/height
			var o_ftsize=handle.attr("o-font");
			var ratio=option.width/owidth;
			option.height=option.width/rate;
			font_size=(o_ftsize*ratio<10)?10:o_ftsize*ratio;
			handle.css("width",option.width).css("height",option.height);
			handle.find(".seven_caption").css("font-size",font_size);
			handle.find("#seven_sublightbox").css("width",option.width+8).css("height",option.height+8).css("marginLeft",(-option.width/2)-4).css("marginTop",-option.height/2);
			handle.find(".seven_operate").each(function(i)
			{
				var prev=(current_index-1<0)?length-1:current_index-1;
				var next=(current_index+1)%length;
				if(current_index!=target_index) next=target_index;
				var index=[prev,current_index,next];
				var name_arr=["#seven_prev","#seven_current","#seven_next"];
				var temp=seven_get_imagesize(handle.find(".seven_slide:nth-child("+parseInt(index[i]+1)+")").find(".seven_image"));
				var temp_rate=temp.width/temp.height;
				if(rate>=temp_rate)
					handle.find(name_arr[i]).find(".seven_image").css("height","").css("width",option.width);
				else 
					handle.find(name_arr[i]).find(".seven_image").css("width","").css("height",option.height);
			});
		}
		//seven lightbox carousel refresh
		function seven_lightbox_refresh(flag)
		{
			var cache=handle.find("#seven_thumb_container");
			var board=handle.find("#seven_subboard");
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
		//seven carousel refresh
		function seven_carousel_refresh()
		{
			//In case carousel overflows the board
			switch(option.carousel)
			{
				case 'horizontal':
					if(c_flag==1) return false;
					var width=handle.find("#seven_hviewport").width();
					var twidth=handle.find(".seven_hcarousel").width();
					var board=handle.find("#seven_hsubboard");
					if(width<twidth)
					{
						board.css("marginLeft",0);
					}
					else
					{
						if(thumb_width*current_index+twidth>width)	board.css("marginLeft",twidth-width);
						else board.css("marginLeft",-thumb_width*current_index);
					}
				break;
				case 'vertical':
					if(c_flag==1) return false;
					var height=handle.find("#seven_vviewport").height();
					var board=handle.find("#seven_vsubboard");
					if(height<option.height)
					{
						board.css("marginTop",0);
					}
					else
					{
						if(80*current_index+option.height>height)	board.css("marginTop",option.height-height);
						else board.css("marginTop",-80*current_index);
					}
				break;
			}
		}
		//get imageSize
		function seven_get_imagesize(src)
		{
			var arr=[];
			var hiddenImg = src.clone().css('visibility', 'hidden').removeAttr('height').removeAttr('width').appendTo('body');
			arr.width=hiddenImg.width();
			arr.height=hiddenImg.height();
			hiddenImg.remove();
			return arr;
		}
		//bullet initialization
		function seven_bullet_setup()
		{
			//add bullet to the div
			handle.append("<div class='seven_bullet_control'><div id='seven_bullet_viewport' class='seven_clearfix' align='center'><div id='seven_bullet_inner_viewport'></div></div></div>");
			//seven_thumbnail
			$("<div class='seven_bt_preview'><div class='seven_filter_bt'><div class='seven_bt_container'></div></div></div>").insertAfter(handle.find("#seven_bullet_viewport"));
			handle.find(".seven_slide").each(function(i)
			{
			  //Bullet
			  if(i==0)
				  handle.find("#seven_bullet_inner_viewport").append("<div class='seven_circle active'></div>");
			  else
				  handle.find("#seven_bullet_inner_viewport").append("<div class='seven_circle'></div>");
			  //Thumbnail
			  handle.find(".seven_bt_container").append("<div class='seven_bt_slide'><img class='seven_preview_img' src='"+$(this).find(".seven_image").attr("src")+"'/></div>");
			});
			//adjust width of the button container
			handle.find(".seven_bt_container").css("width",40*length);		  
		}
		//show carousels
		function seven_carousel_setup()
		{
			var tarray=[];
			tarray['default']=54;
			tarray['round']=119;
			tarray['jumbo']=119;
			tarray['science']=54;
			tarray['sapphire']=60;
			tarray['ios7']=60;
			tarray['beach']=90;
			switch(option.carousel)
			{
				case 'horizontal':
					//horizontal carousel bar
					handle.append("<div class='seven_hcarousel'><div id='seven_hsubboard'><div id='seven_hviewport'></div></div></div>");
					handle.find(".seven_slide").each(function(i)
					{
						  var src=$(this).find(".seven_image").attr("src");
						  if(i==0)
						  	handle.find("#seven_hviewport").append("<div class='carousel active'><div class='seven_ci'><img src='"+src+"'/></div></div>"); 
						  else
							handle.find("#seven_hviewport").append("<div class='carousel'><div class='seven_ci'><img src='"+src+"'/></div></div>"); 
					});
					thumb_width=tarray[option.skin];
				break;
				case 'vertical':
					//horizontal carousel bar
					handle.append("<div class='seven_vcarousel'><div id='seven_vsubboard'><div id='seven_vviewport'></div></div></div>");
					if(60*length<option.height) handle.find("#seven_vviewport").css("marginTop",-30*length);
					else handle.find("#seven_vviewport").css("top",0);
					handle.find(".seven_slide").each(function(i)
					{
						  var src=$(this).find(".seven_image").attr("src");
						  if(option.skin!='xmas'){
							  if(i==0)
								handle.find("#seven_vviewport").append("<div class='carousel active'><div class='seven_ci'><img src='"+src+"'/></div></div>"); 
							  else
								handle.find("#seven_vviewport").append("<div class='carousel'><div class='seven_ci'><img src='"+src+"'/></div></div>"); 
						  }
						  else
						  {
							  if(i==0)
								handle.find("#seven_vviewport").append("<div class='carousel active'><div class='seven_ci'><img src='"+src+"'/></div><div class='seven_tcarousel' /></div></div>"); 
							  else
								handle.find("#seven_vviewport").append("<div class='carousel'><div class='seven_ci'><img src='"+src+"'/></div><div class='seven_tcarousel'/></div></div>"); 
						  }
					});
				break;
			}
			
		}
		//set up the skin
		function seven_skin_setup()
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
				option.carousel=false;
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
				seven_bullet_setup(handle);
				handle.find(".seven_hcarousel").addClass("seven_bullet");
			}
			//initialization for carousel
			if(option.carousel!=false)
			{
			   seven_carousel_setup(option.carousel,handle);
			}
			
			handle.addClass("seven_"+option.skin);
			handle.append("<div id='seven_lbox'></div>").append("<div class='seven_a_play "+option.skin+"_play'></div>");
			if(option.skin=='jumbo') handle.prepend('<img src="'+option.path+'img/ribbon.png" style="position:absolute;left:-20px;top:-20px;z-index:100;"/>');
			else if(option.skin=='starworld') handle.prepend('<div id="seven_numboard">1 / '+length+'</div>');
			else if(option.skin=='sapphire') handle.prepend('<div id="seven_sapphire_header"></div>');
			else if(option.skin=='xmas') handle.prepend("<div id='seven_lbal' class='seven_balcony'><img src='"+option.path+"img/skin/xmas_bal.png'/></div><div id='seven_rbal' class='seven_balcony'><img src='"+option.path+"img/skin/xmas_bal.png'/></div><div id='seven_tbal' class='seven_tbalcony'><img src='"+option.path+"img/skin/xmas_tsnow.png'/></div>");

		}
		//initialize the progress bar
		function seven_progressbar_setup()
		{
			  if(a_flag==0) return false;
			  switch(option.progressbartype)
			  {
				  case 'linear':
				  		if(handle.find("#lp_ct").length==0)
							handle.find("#seven_viewport").prepend('<div id="lp_ct" class="progressbar"><div id="lprogress"></div></div>');
				  break;
				  case 'circle':
				  		if(handle.find("#cprogress").length==0)
							handle.find("#seven_viewport").prepend('<div id="cprogress" class="progressbar"><input class="knob cprogress" data-thinkness=".1" data-skin="tron" data-linecap="round" data-fgcolor='+pcolor+' data-width="40" data-displayInput=false value="0"></div>');
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
		//linear automate function
		function seven_linear_automate()
		{
		  var rwidth=handle.find("#lp_ct").width();
		  /* full width progress bar */
		  if(option.skin=='transformer') rwidth-=200;
		  t_val+=parseInt((rwidth-10)/(20*option.interval));
		  if(t_val>=parseInt(rwidth-10))
		  {
			  seven_next();
		  }
		  handle.find("#lprogress").css("width",t_val);	  
		}
		//circle automate function
		function seven_circle_automate()
		{
		   t_val+=5000/(option.interval*1000);
		   if(t_val>=100)
		   {
			   seven_stop();
			   seven_next();
		   }
		   handle.find('.cprogress').val(Math.ceil(t_val)).trigger('change');
		}
		//move to the previous slide
		function seven_current()
		{			
			c_flag=0;
			if(option.repeat_mode==false)
			{
			  if(current_index>0)
				seven_animation(current_index-1);
			  else
				seven_stop();
			}
			else
			{
				if(current_index==0) 
					seven_animation(length-1);
				else
					seven_animation(current_index-1);
			}
		}
		//move to the next slide
		function seven_next()
		{
			c_flag=0;
			if(option.repeat_mode==false)
			{
			  if(current_index<length-1)
				seven_animation(current_index+1);
			  else
				  seven_stop();
			}
			else
				seven_animation((current_index+1)%length);						
		}
		//move to prev carousel
		function seven_prev_carousel()
		{
			  if(100*length<option.width)	return false;
			  var tb=parseInt(option.width/160);
			  var temp=Math.abs(Math.ceil(parseInt(handle.find("#seven_hviewport").css("left"))/160));
			  if(temp>=tb)
			  {
				 handle.find("#seven_hviewport").animate({
					 "left":-100*(temp-tb),													 
				 },
				 {
					 duration:200,
					 easing:"swing"
				 });
			 }
			 else
			 {
				  handle.find("#seven_hviewport").animate({
					 "left":"0px",													 
				 },
				 {
					 duration:200,
					 easing:"swing"
				 });
			}	  
		}
		//move to next carousel
		function seven_next_carousel()
		{
			  if(100*length<option.width)	  return false;
			  var tb=parseInt(option.width/160);
			  var temp=Math.abs(Math.ceil(parseInt(handle.find("#seven_hviewport").css("left"))/160));
			  if(temp<(length-(tb*2)))
			  {
				 handle.find("#seven_hviewport").animate({
					 "left":-100*(temp+tb),													 
				 },
				 {
					 duration:400,
					 easing:"swing"
				 });
			 }
			 else
			 {
				  handle.find("#seven_hviewport").animate({
					 "left":-(handle.find("#seven_hviewport").width()-option.width)+"px",																			 		  
				  },
				  {
					 duration:400,
					 easing:"swing"
				  });
			 }
		}
		//preview slide on mousehover
		function seven_thumb_preview(arg){	  	
			var tleft=handle.find("#seven_bullet_inner_viewport").position().left;  
			var temp=parseInt(handle.find(".seven_circle").width())+2*parseInt(handle.find(".seven_circle").css("margin-left"));	  
			var tpad=parseInt(handle.find("#seven_bullet_inner_viewport").css("padding-left"));	
			handle.find('.seven_bt_preview').css("left",tleft);
			switch(t_flag)
			{
				  //When newly hover
				  case 0:
					  //calculate circle width including margin
					  handle.find('.seven_bt_preview').css("margin-left",tpad+arg*temp-27+temp/2);
					  handle.find('.seven_bt_container').css('margin-left',-40*arg);
					  handle.find(".seven_bt_preview").fadeIn(200);	
				  break;
				  //consequent hover
				  case 1:
					  //calculate circle width including margin
					  var temp=parseInt(handle.find(".seven_circle").width())+2*parseInt(handle.find(".seven_circle").css("margin-left"));
					  
					  handle.find('.seven_bt_preview').delay(50).animate({
								"margin-left":tpad+arg*temp-27+temp/2,
						   },
						   {
								duration:200,
								queue:false,
								easing:"easeOutSine"
						   });
						  handle.find('.seven_bt_container').animate({
								"margin-left":-40*arg,
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
		//hide preview slide on mouseout
		function seven_thumb_hide()
		{
			//thumbnail flag switch to newly hover
			t_flag=0;
			handle.find(".seven_bt_preview").hide();
		}
		//adjust carousel pos 
		function seven_adjust_carousel(arg)
		{
			switch(option.carousel)
			{
				case 'horizontal':
					var twidth=handle.find(".seven_hcarousel").width();
					if(c_flag==1)
					{					
						return false;
					}
					if(thumb_width*length<option.width) return false;
					var cache=handle.find("#seven_hsubboard");
					var board=handle.find("#seven_hviewport");
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
					var cache=handle.find("#seven_vsubboard");
					var board=handle.find("#seven_vviewport");
					var offset=60*target_index;
					if(offset+option.height>board.height())  offset=option.height-board.height();
					else offset=-60*target_index;
					if(option.skin!='transformer') cache.animate({"marginTop":offset},{duration:200,easing:"easeOutSine"});
				break;
			}
			
		}
		//check if Browser is IE and return version No.
		function seven_isIE () {
			var myNav = navigator.userAgent.toLowerCase();
			return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
		}
		//random number generator
		function seven_rand_generator(limit)
		{
			var order=new Array(limit);
			for(var i=0;i<limit;i++)
			{
				  var temp;
				  var tflag=true;
				  while(tflag)
				  {
					  tflag=false;
					  temp=Math.floor((Math.random()*limit));
					  for(var j=0;j<i;j++)
					  {
						  if(order[j]==temp)
								tflag=true;  
					  }
				  }
				  order[i]=temp;
			}
			return order;
		}
		//animation function
		function seven_animation(arg)
		{
			//while animation is going on or same index
			if(lock==1||current_index==arg) return false;
			//main func
			lock=1;
			option.onanimstart();
			seven_stop();
			target_index=arg;
			var cache=handle.find("#seven_next");
			cache.html(handle.find(".seven_slide:nth-child("+(target_index+1)+")").html());
			if(!cache.find(".seven_image").hasClass("active"))
			{
				handle.find("#seven_current").prepend("<img class='seven_load' src='img/skin/"+option.skin+"_loader.gif' />");
				cache.find(".seven_image").load(function()
				{
					$(this).addClass("active");
					handle.find("#seven_current").find(".seven_load").remove();
					seven_animate_init();
				});
			}
			else	seven_animate_init();			
		}
		//animate initialization
		function seven_animate_init()
		{
			handle.find(".seven_video").remove();
			//resize the screen before animation
			seven_respond();			
			/* circle/carousel adjust */
			handle.find(".seven_circle").removeClass("active");
			handle.find(".carousel").removeClass("active");
			handle.find(".seven_circle:nth-child("+(target_index+1)+")").addClass("active");
			handle.find(".carousel:nth-child("+(target_index+1)+")").addClass("active");
			//adjust carousel Pos
			if(option.carousel!=false)	  seven_adjust_carousel(current_index);
			clearInterval(kentimer);
			code=parseInt(Math.random()*8)+1;
			if(code>4) handle.find(".seven_operate:not(#seven_current)").find(".seven_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate); 
			//caption 
			seven_caption_animate();
		}
		//caption animate
		function seven_caption_animate()
		{
			var anim_array=[[-1,0],[1,0],[0,-1],[0,1]];
			var a_code,caption;
			a_code=handle.find(".seven_slide:nth-child("+(target_index+1)+")").attr("data-animation");
			caption=handle.find(".seven_slide:nth-child("+(current_index+1)+")").attr("data-caption");
			if(typeof(a_code)=='undefined')
			{
				a_code=(option.animation==0)?(parseInt(Math.random()*5)+1):option.animation;
			}
			else
				a_code=parseInt(a_code);
			
			if(typeof(caption)=='undefined'||caption=='') 
			{
				//animation is done
				handle.find(".seven_caption").hide();
				seven_2d_animate(a_code);
			}
			else
			{
				//Initialization for Layer
				handle.find("#seven_current .seven_caption").css("marginLeft",0).css("marginBottom",0).animate({
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
						handle.find(".seven_caption").hide();
						if(a_code<=302) 
							seven_2d_animate(a_code);
						else
							seven_3d_animate(a_code-302);
					}
				});		
			}
		}
		//caption animate emerge
		function seven_caption_end_animate()
		{
			if(code>4) handle.find(".seven_operate").find(".seven_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate); 
			seven_kenburn();
			var anim_array=[[-1,0],[1,0],[0,-1],[0,1]];
			var a_code;
			var opacity;
			//check if browser is ie
			if(seven_isIE()<9&&seven_isIE()!=false)
				opacity=0.4;
			else
				opacity=1;
			//Initialization for Layer
			caption=handle.find(".seven_slide:nth-child("+(current_index+1)+")").attr("data-caption");
			if(typeof(caption)=='undefined'||caption=='') 
			{
				//animation is done
				lock=0;
				option.onanimend();	
				if(option.responsive==true)	seven_respond();
				handle.find("#seven_next .seven_caption").stop();
				//if autoplay is on
				if(a_flag==1)	seven_start();
			}
			else
			{
				handle.find(".seven_caption").show();
				handle.find("#seven_current .seven_caption").css("marginLeft",anim_array[option.caption_animation][0]*140).css("marginBottom",anim_array[option.caption_animation][1]*60).css("opacity",0).animate({
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
						if(option.responsive==true)	seven_respond();
						handle.find("#seven_next .seven_caption").stop();
						//if autoplay is on
						if(a_flag==1)	seven_start();
					}
				});	
			}
		}
		function seven_kenburn()
		{
			var cache=handle.find("#seven_current").find(".seven_image");
			var ctx;
			var offset=0;
			var toff=(code<5)?0:200;
			var awidth=[0,0,0,0,0,400,400,400,400,400];
			handle.find(".seven_canvas").remove();
			if(seven_isIE()!=false&&seven_isIE()<9)
			{
				var oarr=[[-100,0],[-200,0],[-200,-200/rate],[-80,-200/rate],[-120,-80/rate],[-200,0],[-200,-200/rate],[0,-200/rate],[-80,-200/rate],[-80,-80/rate]];
				var toffset=(code<5)?400:-400;
				$("<img class='seven_canvas' width='"+(option.width+awidth[code])+"' src='"+cache.attr("src")+"'/>").insertAfter(cache);
				handle.find("#seven_current .seven_canvas").css("marginLeft",-toff).css("marginTop",-toff/rate).animate({width:"+="+toffset/4,"marginLeft":"+="+oarr[code][0]/12,"marginTop":"+="+oarr[code][1]/(rate*12)},{duration:5000,easing:"easeOutSine"});
			}
			else
			{
					$("<canvas class='seven_canvas' width='"+option.width+"' height='"+option.height+"'></canvas>").insertAfter(cache);
					ctx=handle.find(".seven_canvas")[0].getContext("2d");
					ctx.drawImage(cache[0],-200,-200,option.width+awidth[code],(width+awidth[code])/rate);
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
						var oarr=[[-offset/5,0],[-offset,0],[-offset,-offset/rate],[-offset/5,-offset/rate],[-offset/3,-offset/(5*rate)],[offset,0],[-offset,offset/rate],[0,offset/rate],[-offset/5,offset/rate],[offset/2,offset/(5*rate)]];
						if(offset>200&&code<5)
						{
							clearInterval(kentimer);
							return;
						}
						else if(code>4&&offset<-100)
						{
							clearInterval(kentimer);
							return;
						}
						clear();
						if(code<5) offset+=0.35;
						else offset-=0.35;
						ctx.drawImage(cache[0],oarr[code][0]-toff,oarr[code][1]-toff/rate,option.width+awidth[code]+offset,(option.width+awidth[code]+offset)/rate);
					}
					kentimer=setInterval(update,30);
			}
		}
		//2d animation
		function seven_2d_animate(code)
		{
			switch(code)
			{
				case 1:
					seven_linear_move(0);
				break;
				case 2:
					seven_linear_move(1);
				break;
				case 3:
					seven_linear_move(2);
				break;
				case 4:
					seven_linear_move(3);
				break;
				case 5:
					seven_fade();
				break;
				case 6:
					seven_fade_overlap();
				break;
			}
		}
		/* 2d functions */
		function seven_linear_move(code)
		{
			var p_arr=[[100,0,0,0],[-100,0,0,0],[0,100,0,0],[0,-100,0,0]];
			var t_arr=[[-option.width,0],[option.width,0],[0,-option.height],[0,option.height]];
			//initialize for anim
			handle.find("#seven_next").css("left",p_arr[code][0]+"%").css("top",p_arr[code][1]+"%");
			handle.find("#seven_current").css("left",p_arr[code][2]+"%").css("top",p_arr[code][3]+"%");
			//anim func
			handle.find('.seven_animate').each(function(i)
			{
				$(this).animate({
					"left":"+="+t_arr[code][0]+"px",
					"top":"+="+t_arr[code][1]+"px",
				},
				{
					duration:800,
					easing:"easeInOutSine",
					complete: function()
					{
						 //All animation is done
						 if(i==0) seven_animate_end(); 
					}
				});
			});
		}
		function seven_fade()
		{
		   //initialize for anim
			handle.find("#seven_next").css("left","0%").css("top","0%");
			handle.find("#seven_current").css("left","0%").css("top","0%");		
					
			//prepare for anim
			handle.find("#seven_next").css("opacity",0);
					
			//anim func
			handle.find("#seven_next").animate({
				"opacity":1,
			},
			{
				duration:800,
				easing:"easeOutSine",
				complete: function()
				{	
					// All animation is done
					seven_animate_end(); 
				}												 
					
			});
		}
		function seven_fade_overlap()
		{
		   var pimagewidth=handle.find("#seven_current .seven_image").width(),pimageheight=handle.find("#seven_current .seven_image").height(),psrc=handle.find("#seven_current .seven_image").attr("src");
			var nimagewidth=handle.find("#seven_next .seven_image").width(),nimageheight=handle.find("#seven_next .seven_image").height(),nsrc=handle.find("#seven_next .seven_image").attr("src");
			var pl,pt;
			pl=parseInt(handle.find("#seven_next .seven_image").css("marginLeft"));
			pt=parseInt(handle.find("#seven_next .seven_image").css("marginTop"));			
		   //initialize for anim
			handle.find("#seven_next").css("left","100%").css("top","0%");
			handle.find("#seven_current").css("left","0%").css("top","0%");	
			//prepare temp divs for transition
			var blind="<div id='seven_blind_container' style='position:absolute;width:100%;height:100%;z-index:80'>";
			var b_pos=[[-100,-100],[-100,100],[100,100],[100,-100]];
			for(var i=0;i<4;i++)
			{
				//calculate div pos
				blind+="<div class='seven_blind_slide' style='position:absolute;overflow:hidden;width:100%;height:100%;'><img src='"+nsrc+"' style='position:absolute;width:"+nimagewidth+"px;height:"+nimageheight+"px;left:"+b_pos[i][0]+"px;top:"+b_pos[i][1]+"px;margin-left:"+pl+"px;margin-top:"+pt+"px;'/></div>";		
			}
			blind+="</div>";
			$(blind).insertBefore(handle.find("#seven_next"));
			handle.find(".seven_blind_slide img").css("opacity",0);
					
			//anim func
			handle.find(".seven_blind_slide img").each(function(i)
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
							seven_animate_end(); 
					}												 
				});
			});
		}
		//end animate 
		function seven_animate_end()
		{
			var opacity;
			handle.css("background-color","#000");
			handle.find("#seven_blind_container").remove();
			handle.find(".seven_cube").remove();
			handle.find(".seven_operate").stop();
			handle.find("#seven_current").css("left",0).css("top",0);
			handle.find("#seven_next").css("left","100%").css("top","0%");
			//set current slide
			current_index=target_index;
			seven_set_current_slide(current_index);
			seven_caption_end_animate();
		}
		//start autoplay
		function seven_start()
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
							timer=setInterval(seven_linear_automate,50);
							handle.find("#lprogress").css("width",t_val);
					  break;
					  case 'circle':
							timer=setInterval(seven_circle_automate,50);		  
							handle.find('.cprogress').val(t_val).trigger('change'); 
					  break;
				  }
			}
		}
		//pause autoplay
		function seven_pause()
		{
			clearInterval(timer);
			handle.find(".progressbar").removeClass("on");
		}
		//stop autoplay
		function seven_stop()
		{
			clearInterval(timer);
			handle.find(".progressbar").hide();
			handle.find(".progressbar").removeClass("on");
			t_val=0;
		}
		//show lightbox
		function seven_lightbox_setup()
		{
			//check if lightbox is enable
			if(option.lightbox==true&&handle.find("#seven_lightbox").size()<1)
			{
				
				a_flag=0;
				handle.find(".seven_a_play").addClass("seven_a_pause");
				seven_stop();
				var attr=$(".seven_slide:nth-child("+(current_index+1)+")");
				var size=seven_get_imagesize(attr);
				var width=option.width;
				var height=option.height;
				handle.append("<div id='seven_lightbox'><div id='seven_lightbox_overlay'></div><div id='seven_sublightbox'><div id='seven_lightbox_control_close'></div><div id='seven_lightbox_control_prev' class='seven_lcontrol'></div><div id='seven_lightbox_control_next' class='seven_lcontrol'></div><div id='seven_lviewport'></div></div></div>");
				handle.find("#seven_lightbox").append("<div id='seven_lightbox_thumb' class=''><div id='seven_subboard'><div id='seven_thumb_container'></div></div></div>");				
				handle.find(".seven_slide").each(function(i)
				{
					var src=$(this).find(".seven_image").attr("data-src");
					if(i==current_index)
					  handle.find("#seven_thumb_container").append("<div class='seven_thumb active'><div class='seven_subthumb'><img class='seven_thumb_img' src='"+$(this).find(".seven_image").attr("src")+"' data-src='"+src+"'/></div></div>");
					else
					  handle.find("#seven_thumb_container").append("<div class='seven_thumb'><div class='seven_subthumb'><img class='seven_thumb_img' src='"+$(this).find(".seven_image").attr("src")+"' data-src='"+src+"'/></div></div>");
					
				});
				handle.find("#seven_thumb_container").css("width",54*length);
				handle.find("#seven_lviewport").html(attr.html());
				if(seven_isIE()!=false&&seven_isIE()<9)
				{
					handle.find("#seven_sublightbox").css("width",width).css("height",height).css("marginLeft",(-width/2)).css("marginTop",-height/2).css("opacity",0);
					handle.find("#seven_sublightbox").animate({
						"opacity":1,
					},
					{
						duration:400,
						easing:"easeOutSine"
					});
				}
				else
				{
					handle.find("#seven_sublightbox").css("width",width).css("height",height).css("marginLeft",-width/2).css("marginTop",-height/2).css("opacity",0).scale(0.5);
					handle.find("#seven_sublightbox").animate({
						"opacity":1,
						"scale":1,
					},
					{
						duration:400,
						easing:"easeOutSine"
					});
				}
/*				handle.find(".seven_thumb").find(".seven_thumb_img").greyScale({
				  // call the plugin with non-defult fadeTime (default: 400ms)
				  fadeTime: 500,
				  reverse: false
				});*/
			}
		}
		//swipe function
		function seven_swipe_function(e)
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
								handle.find(".seven_operate").css("marginLeft",0).css("marginTop",0);
								handle.find("#seven_prev").css("left","-100%").css("top","0");
								handle.find("#seven_next").css("left","100%").css("top","0");
							}
							//lock the key
							if(direction>-1)
							{
								lock=1;
								handle.find(".seven_operate").each(function(i){
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
												seven_swipe_end();
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
								handle.find(".seven_operate").css("marginLeft",0).css("marginTop",0);
								handle.find("#seven_prev").css("left","-100%").css("top","0");
								handle.find("#seven_next").css("left","100%").css("top","0");
							}
							//lock the key
							if(direction>-1)
							{
								lock=1;
								handle.find(".seven_operate").each(function(i){
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
												seven_swipe_end();
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
					handle.find(".seven_operate").css("marginLeft",0).css("marginTop",0);
					handle.find("#seven_prev").css("left","-100%").css("top","0");
					handle.find("#seven_next").css("left","100%").css("top","0");
					if(a_flag==1) seven_start();
				//	seven_lightbox_setup();
				}
			}
		}
		//swipe end process
		function seven_swipe_end()
		{
			seven_set_current_slide(current_index);
			handle.find(".seven_operate").css("marginLeft",0).css("marginTop",0);
			handle.find("#seven_prev").css("left","-100%").css("top","0").css("marginLeft",0).css("marginTop",0);
			handle.find("#seven_next").css("left","100%").css("top","0").css("marginLeft",0).css("marginTop",0);
			//adjust carousel Pos
			handle.find(".seven_circle").removeClass("active");
			handle.find(".carousel").removeClass("active");
			handle.find(".seven_circle:nth-child("+(current_index+1)+")").addClass("active");
			handle.find(".carousel:nth-child("+(current_index+1)+")").addClass("active");
			target_index=current_index;
			if(option.carousel!=false)
			{
				c_flag=0;
				seven_adjust_carousel(current_index);
			}
			seven_respond();
			lock=0;
			sd_flag=0;
			if(a_flag==1) seven_start();
			if(code>4) handle.find(".seven_operate").find(".seven_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate); 
			seven_kenburn();
		}
		function seven_lightbox_slide(index)
		{
			if(handle.find("#seven_sublightbox_temp").length>0) return false;
			var width=option.width,height=option.height;
			var attr=$(".seven_slide:nth-child("+(index+1)+")");
			handle.find("#seven_sublightbox").append("<div id='seven_sublightbox_temp'></div>");
			handle.find("#seven_sublightbox_temp").html(attr.html());
			handle.find("#seven_sublightbox_temp").find(".seven_image").css("width",option.width);
			handle.find("#seven_sublightbox_temp").css("marginLeft",-80).css("opacity",0);
			handle.find(".seven_thumb").removeClass("active");
			handle.find(".seven_thumb:nth-child("+(index+1)+")").addClass("active");
			handle.find("#seven_sublightbox_temp").animate({
				'opacity':1,
				'marginLeft':"+=80px"
			},
			{
				duration:400,
				easing:"easeOutSine"
			});
			handle.find("#seven_lviewport").animate({
				'opacity':0,
				'marginLeft':"+=80px"
			},
			{
				duration:400,
				easing:"easeOutSine",
				complete:function()
				{
					handle.find("#seven_lviewport").remove();					
					handle.find("#seven_sublightbox_temp").stop().css("marginLeft","").css("marginTop","").attr("id","seven_lviewport");
				}
			});
		}
		//DOM element events
		$(document).ready(function()
		{							
			//bind event handler
			$(document).bind("dragstart", function() { return false; });
			$(document).keyup(function(e) {
					if(option.keyboard==true)
					{
						  if(e.keyCode == 37) { // left
								seven_current();
						  }
						  else if(e.keyCode == 39) { // right
								seven_next();
						  }	
						  else if(e.keyCode==27)
						  {	
							  handle.find("#seven_sublightbox").animate({
									"opacity":0,
									"scale":0.1,
							  },
							  {
									duration:200,
									easing:"easeOutSine",
									complete:function()
									{
										handle.find("#seven_lightbox").remove();  
									}
							  });
						  }
					}
			});

			var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
			handle.bind(mousewheelevt, function(e){
			
				var evt = window.event || e //equalize event object     
				evt = evt.originalEvent ? evt.originalEvent : evt; //convert to originalEvent if possible               
				var delta = evt.detail ? evt.detail*(-40) : evt.wheelDelta //check for detail first, because it is used by Opera and FF
			
				if(delta > 0) {
					//scroll up
					if(option.scrollmode) seven_next();
				}
				else{
					//scroll down
					if(option.scrollmode) seven_current();
				}   
				return false;
			});

			//navigation button
			handle.find("#left_btn").bind("click", seven_current);
			handle.find("#right_btn").bind("click",	seven_next);
			//mousemove
			handle.find('#seven_viewport').mousedown(function(e){									  
				if(option.swipe==true&&lock==0) 														  
				{
					mp_temp=[e.pageX,e.pageY];
					mpflag=1;
					seven_respond();
					seven_stop();
					$(this).addClass("cursor_down");
					code=parseInt(Math.random()*8)+1;
					clearInterval(kentimer);
				}															  
			}).mousemove(function(e){	
				 if(mpflag==1&&lock==0)
				 {
					//kenburn
					if(code>4) 
					{
						handle.find(".seven_operate:not(#seven_current)").find(".seven_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate);
					}
					else
					{
						handle.find(".seven_operate:not(#seven_current)").find(".seven_image").css("margin",0);
					}
					var offsetx=offsety=0;
					offsetx=e.pageX-mp_temp[0];
					offsety=e.pageY-mp_temp[1];
					//set swipe direction
					if(sd_flag==0)
					
					{
						sd_flag=(Math.abs(offsetx)>Math.abs(offsety))?1:2;
						if(sd_flag==2)
						{
							handle.find("#seven_prev").css("left","0").css("top","-100%");
							handle.find("#seven_next").css("left","0").css("top","100%");
						}
					}
					//make proper action
					if(sd_flag==1)
						handle.find(".seven_operate").css("marginLeft",offsetx);
					else if(sd_flag==2)
						handle.find(".seven_operate").css("marginTop",offsety);
				 }
			}).mouseup(function(e){
				$(this).removeClass("cursor_down");
				if(lock==1) return;
				seven_swipe_function(new Array(e.pageX,e.pageY));
			}).mouseleave(function(e)
			{
				$(this).removeClass("cursor_down");				
				if(lock==1) return;
				seven_swipe_function(new Array(e.pageX,e.pageY));
			});
			//touch event for swipe
			handle.find("#seven_viewport").on('touchstart',function(e)
			{
				if(option.swipe==true&&lock==0) 														  
				{
					 mp_temp=[e.originalEvent.touches[0].pageX,e.originalEvent.touches[0].pageY];
					 mpflag=1;
					 seven_respond();
					 seven_stop();
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
						handle.find(".seven_operate:not(#seven_current)").find(".seven_image").css("width",option.width+400).css("height",(option.width+400)/rate).css("marginLeft",-200).css("marginTop",-200/rate);
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
							handle.find("#seven_prev").css("left","0").css("top","-100%");
							handle.find("#seven_next").css("left","0").css("top","100%");
						}
					}
					//make proper action
					if(sd_flag==1)
						handle.find(".seven_operate").css("marginLeft",offsetx);
					else if(sd_flag==2)
						handle.find(".seven_operate").css("marginTop",offsety);
				 }
			}).on('touchend',function(e)
			{
				if(lock==1) return;
				seven_swipe_function(new Array(e.originalEvent.changedTouches[0].pageX,e.originalEvent.changedTouches[0].pageY));				
			});
			handle.on('click','#seven_lbox',function(){seven_lightbox_setup();});
			//preview slide event
			handle.on('mouseover',".seven_circle",function(){ seven_thumb_preview($(this).index());	});	
			//hide slide-preview
			handle.on("mouseleave","#seven_bullet_inner_viewport",function(){ seven_thumb_hide();	});
			//bullet click
			handle.on("click",".seven_circle",function(){ seven_animation($(this).index());	});
			/* auto play button */
			handle.on("click",".seven_a_play",function(){
				  if(!$(this).hasClass("seven_a_pause"))
				  {
						$(this).addClass("seven_a_pause");													
						a_flag=0;
						seven_stop();
				  }
				  else
				  {
						$(this).removeClass("seven_a_pause");													
						if(a_flag==0)
						{
							a_flag=1;						
							if(option.progressbar)
							 	seven_progressbar_setup();							 
						}
						a_flag=1;						
						seven_start();
				  }
			});
			//carousel prev
			handle.on("click",".seven_carousel_nav.cn_left",function()	{	seven_prev_carousel();	});
			//carousel next
			handle.on("click",".seven_carousel_nav.cn_right",function(){	seven_next_carousel();	});
			handle.on("click",".carousel",function(){	c_flag=1; seven_animation($(this).index(),1);});
			
			handle.find(".carousel").on('touchstart',function(e){
				tp_temp=e.originalEvent.touches[0].pageX;
			}).on('touchend',function(e){
				var temp=e.originalEvent.changedTouches[0].pageX;
				if(c_flag==1&&Math.abs(temp-tp_temp)<3)
					seven_animation($(this).index(),1);
			});
			//Carousel swipe
			handle.on('touchstart','.seven_hcarousel',function(e)
			{
				 cr_temp=e.originalEvent.touches[0].pageX;	
				 mp_flag=1;
				 c_flag=0;
			}).on('touchmove',function(e)
			{
				var cache=handle.find("#seven_hviewport");
				var board=handle.find("#seven_hsubboard");
				var width=board.width();
				if(cache.width()<width) return false;
				var offset=e.originalEvent.changedTouches[0].pageX - cr_temp;
				var left=parseInt(board.css("marginLeft"));
				board.css("marginLeft",left+offset);
				
			}).on('touchend',function(e)
			{
				var temp=e.originalEvent.changedTouches[0].pageX;
				mp_flag=0;
				// carousel is less than window width
				if(thumb_width*length<option.width)
				{
					handle.find("#seven_hsubboard").animate({
						"marginLeft":0,
					},
					{
						duration:200,
						easing:"easeOutSine"
					});
				}
				if(temp<cr_temp+5&&temp>cr_temp-5)	c_flag=1;
				var cache=handle.find("#seven_hviewport");
				var board=handle.find("#seven_hsubboard");
				if(parseInt(board.css("marginLeft"))>0)
				{
					handle.find("#seven_hsubboard").animate({
					"marginLeft":0,
					},
					{
						duration:200,
						easing:"easeOutSine"
					});
				}
				else if(parseInt(board.css("marginLeft"))+board.width()>cache.width())
				{
					handle.find("#seven_hsubboard").animate({
					"marginLeft":board.width()-cache.width(),
					},
					{
						duration:200,
						easing:"easeOutSine"
					});
				}
			});
			//Carousel swipe
			handle.on("mousemove",".seven_hcarousel",function(e){
				var cache=handle.find("#seven_hviewport");
				var board=handle.find("#seven_hsubboard");
				var width=board.width();
				if(cache.width()<width) return false;
				var offset=e.pageX - handle.find("#seven_viewport").offset().left;
				board.css("marginLeft",-offset*((cache.width()-width)/width));	
			});
			handle.on("mousemove",".seven_vcarousel",function(e){
				var cache=handle.find("#seven_vviewport");
				var board=handle.find("#seven_vsubboard");
				var height=board.height();
				if(cache.height()<height) return false;
				var offset=e.pageY - handle.find("#seven_viewport").offset().top;
				board.css("marginTop",-offset*((cache.height()-height)/height));	
			});
			handle.on('touchstart',function(e)
			{
				 cr_temp=e.originalEvent.touches[0].pageY;	
				 mp_flag=1;
				 c_flag=0;
			}).on('touchmove',function(e)
			{
				var cache=handle.find("#seven_vviewport");
				var board=handle.find("#seven_vsubboard");
				var height=board.height();
				if(cache.height()<height) return false;
				var offset=e.originalEvent.changedTouches[0].pageY - cr_temp;
				var top=parseInt(board.css("marginTop"));
				board.css("marginTop",top+offset);
			}).on('touchend',function(e)
			{
				var temp=e.originalEvent.changedTouches[0].pageY;
				mp_flag=0;
				// carousel is less than window width
				if(80*length<option.height)
				{
					handle.find("#seven_vsubboard").animate({
						"marginTop":0,
					},
					{
						duration:200,
						easing:"easeOutSine"
					});
				}
				if(temp<cr_temp+5&&temp>cr_temp-5)	c_flag=1;
				var cache=handle.find("#seven_vviewport");
				var board=handle.find("#seven_vsubboard");
				if(parseInt(board.css("marginTop"))>0)
				{
					handle.find("#seven_vsubboard").animate({
					"marginTop":0,
					},
					{
						duration:200,
						easing:"easeOutSine"
					});
				}
				else if(parseInt(board.css("marginTop"))+board.height()>cache.height())
				{
					handle.find("#seven_vsubboard").animate({
					"marginTop":board.height()-cache.height(),
					},
					{
						duration:200,
						easing:"easeOutSine"
					});
				}
			});
			/* pause on hover effect */
			handle.mouseover(function()
			{
				if(option.pause_on_hover)
					seven_pause();
				handle.find(".seven_nav").show();
			}).mouseleave(function()
			{
				if(option.pause_on_hover&&a_flag==1)
					seven_start();
				handle.find(".seven_nav").hide();
			});
			//show video play
			handle.on('click','.seven_play',function()
			{
				var temp=$(this).parent().find(".seven_image").attr("data-src");
				$(this).parent().append("<iframe class='seven_video' src='"+temp+"&autoplay=1"+"'></iframe>");
				seven_pause();			
			});
			handle.on('click','#seven_lightbox_control_next',function()
			{
				var index=$(".seven_thumb.active").index();	
				index=(index+1)%length;
				seven_lightbox_slide(index);
				seven_lightbox_refresh(1);				
			});
			handle.on('click','#seven_lightbox_control_prev',function()
			{
				var index=$(".seven_thumb.active").index();	
				if(index==0)
					index=length-1;
				else
					index-=1;
				seven_lightbox_slide(index);
				seven_lightbox_refresh(0);
			});
			handle.on('mouseout','#seven_lightbox_thumb',function()
			{
				var cache=handle.find("#seven_lightbox_thumb");
				cache.removeClass("active");
			});
			handle.on('mouseover','#seven_lightbox_thumb',function()
			{
				var cache=handle.find("#seven_lightbox_thumb");
				cache.addClass("active");
			});
			handle.on('click','#seven_lightbox_control_close',function()
			{
				handle.find("#seven_lightbox").animate({
					"opacity":0,
				},
				{
					duration:200,
					easing:"easeOutSine",
					complete:function()
					{
						if(a_flag==1) seven_start();
						handle.find("#seven_lightbox").remove();  
					}
				});
			});
			handle.on('click','.seven_thumb',function(){
				var index=$(this).index();	
				seven_lightbox_slide(index);							  
			});
			handle.on('mousemove','#seven_lightbox_thumb',function(e)
			{
				var cache=handle.find("#seven_subboard");
				var width=handle.find("#seven_thumb_container").width();
				if(width<$(window).width()) return false;
				cache.css("marginLeft",-e.pageX*((width-$(window).width())/$(window).width()));
			});
			handle.on('touchstart','#seven_lightbox_thumb',function(e)
			{
				mp_temp=e.originalEvent.touches[0].pageX;
				mpflag=1;
			});
			handle.on('touchmove','#seven_lightbox_thumb',function(e)
			{
				var cache=handle.find("#seven_subboard");
				var offset=e.originalEvent.changedTouches[0].pageX-mp_temp;
				var left=parseInt(cache.css("marginLeft"));
				cache.css("marginLeft",left+offset);
			});
			handle.on('touchend','#seven_lightbox_thumb',function(e)
			{
				var cache=handle.find("#seven_subboard");
				var left=parseInt(cache.css("marginLeft"));
				if(left>0) cache.animate({marginLeft:0},{duration:200,easing:"easeOutSine"});
				else if(left<$(window).width()-$(this).width()) cache.animate({marginLeft:$(window).width()-$(this).width()},{duration:200,easing:"easeOutSine"});
			});
			$(window).resize(function()
			{
				if(lock==1)		return false;		
				if(option.responsive==true)
				{
					c_flag=0;
					clearInterval(kentimer);
					handle.find(".seven_canvas").remove();
					seven_respond();	
					handle.find(".seven_operate").find(".seven_image").css("marginLeft",0).css("marginTop",0);
				}
				if(a_flag==1)
				{
					seven_stop();
					seven_start();
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
