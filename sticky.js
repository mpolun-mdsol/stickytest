(function($, _){
  // general approach:
  // set position:relative on container
  // * clone all sticky-{top/bottom/left/right} elements
  // * every 10ms check if sticky elements are visible
  // * insert clone of fixed elements with position:absolute and top:/bottom:/left:/right: 0 set
  var STICKY_DIRECTIONS = ['top', 'bottom', 'left', 'right'],
      STICKY_CHECK_INTERVAL = 500, // TODO use 10ms or maybe use requestAnimationFrame?
      STICKY_AXIS = {
        vertical: 'v',
        horizontal: 'h'
      }

  function elemInViewportX(elem) {
    var rect = elem[0].getBoundingClientRect(),
        winWidth = $(window).width();

    return (
        rect.left >= 0 &&
        rect.right <= winWidth
    );
  }

  function elemInViewportY(elem) {
    var rect = elem[0].getBoundingClientRect(),
        winHeight = $(window).height();

    return (
        rect.top >= 0 &&
        rect.bottom <= winHeight
    );
  }

  function StickyElement(elem, $container, options) {
    this.$elem = $(elem)
    this.$container = $container
    this.$clone = this.clone()
    this.$elem.addClass('original-element')
    this.replaced = false
    this.direction = this.getDirection()
    this.axis = this.getAxis()
    this.options = options
  }

  StickyElement.prototype.clone = function() {
    return this.$elem.clone()
                  .addClass('replacement-element')
                  .addClass('replaced')
                  .width(this.$elem.width()).insertAfter(this.$elem)
  }

  StickyElement.prototype.getDirection = function() {
    return _.find(STICKY_DIRECTIONS, function(direction){
      return this.$elem.hasClass('sticky-' + direction)
    }, this)
  }

  StickyElement.prototype.getAxis = function() {
    if(this.direction === 'top' || this.direction === 'bottom') {
      return STICKY_AXIS.vertical
    } else {
      return STICKY_AXIS.horizontal
    }
  }

  StickyElement.prototype.visible = function() {
    if(this.axis === STICKY_AXIS.vertical) {
      return elemInViewportY(this.$elem)
    } else {
      return elemInViewportX(this.$elem)
    }
  }

  StickyElement.prototype.needsReplace = function() {
    return this.replaced ? this.visible() : !this.visible()
  }

  StickyElement.prototype.needsPositioning = function() {
    return this.replaced
  }

  function scrollTop() {
    return $(window).scrollTop()
  }

  function offsetTop(elem) {
    return elem.offset().top
  }

  function scrollLeft() {
    return $(window).scrollLeft()
  }

  function offsetLeft(elem) {
    return elem.offset().left
  }

  function scrollBottom() {
    return $(document).height() - $(window).scrollTop() - $(window).height()
  }

  function offsetBottom(elem) {
    return $(document).height() - elem.offset().top - elem.height()
  }

  function scrollRight() {
    return $(document).width() - $(window).scrollLeft() - $(window).width()
  }

  function offsetRight(elem) {
    return $(document).width() - elem.offset().left - elem.width()
  }

  function clamp(val, min, max) {
    return Math.min(
        Math.max(val, min),
        max
      )
  }

  StickyElement.prototype.getOffset = function() {
    var eheight = this.$elem.height(),
        ewidth = this.$elem.width(),
        cheight = this.$container.height(),
        cwidth = this.$container.width()
    switch (this.direction) {
      case 'top': return clamp(scrollTop() - offsetTop(this.$elem), 0, cheight - eheight)
      case 'left': return clamp(scrollLeft() - offsetLeft(this.$elem), 0, cwidth - ewidth)
      case 'bottom': return clamp(scrollBottom() - offsetBottom(this.$elem) + this.options.paddingBottom, 0, cheight - eheight)
      case 'right': return clamp(scrollRight() - offsetRight(this.$elem), 0, cwidth - ewidth)
    }
  }

  StickyElement.prototype.position = function() {
    var offset = this.getOffset()
    this.$clone.css(this.direction, offset + 'px')
  }

  StickyElement.prototype.replace = function() {
    this.replaced = !this.replaced
    this.$elem.toggleClass('replaced')
    this.$clone.toggleClass('replaced')
  }

  StickyElement.prototype.update = function() {
    if(this.needsReplace()) {
      this.replace()
    }
    if(this.needsPositioning()) {
      this.position()
    }
  }

  var defaultOptions = {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0
  }

  function StickyContainer($container, options) {
    this.$container = $container;
    this.stickyElements = [];
    this.options = _.extend({}, defaultOptions, options)
  }

  StickyContainer.prototype.init = function() {
    this.$container.addClass('sticky-container');
    this.getStickyElements()
    setInterval(_.bind(function(){
      this.update()
    }, this), STICKY_CHECK_INTERVAL)
  }

  StickyContainer.prototype.getStickyElements = function() {
    _.forEach(STICKY_DIRECTIONS, function(direction){
      this.stickyElements = this.stickyElements.concat(this.wrappedElements('.sticky-' + direction))
    }, this)
  }

  StickyContainer.prototype.wrappedElements = function(selector) {
    var elements = this.$container.find(selector).toArray()
    return _.map(elements, function(elem){
      return new StickyElement(elem, this.$container, this.options)
    }, this)
  }

  StickyContainer.prototype.update = function() {
    _.forEach(this.stickyElements, function(elem){
      elem.update()
    })
  }

  $.fn.sticky = function sticky(options) {
    return this.each(function(){
      var $this = $(this),
          container = new StickyContainer($this, options);
      container.init();
      $(this).data('sticky', container);
    })
  }

}(jQuery, _))
