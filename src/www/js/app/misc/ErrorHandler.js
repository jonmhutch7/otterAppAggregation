define(function(require) {
  function _throwError(type, appName) {
    var el = $('#error-msg');
    var errorId = 'error-' + $('#error-msg .message').length;

    if (type === 'noReviews') {
      el.append('<div style="opacity: 0;" class="message ' + errorId + '">We\'re having trouble getting reviews for <span class="app-name">' + appName + '</span>. Please check again shortly.<span class="error-close"><span></div>');
    }

    if (type === 'fetchError') {
      el.append('<div style="opacity: 0;" class="message ' + errorId + '">Looks like the server is having trouble retrieving data for an app you selected.<span class="error-close"><span></div>');
    }

    if (type === 'otterError') {
      el.append('<div style="opacity: 0;" class="message ' + errorId + '">Uh oh! Something went wrong processing your request. Please try again later!<span class="error-close"><span></div>');
    }

    if (type === 'apiDown') {
      el.append('<div style="opacity: 0;" class="message popover show-error"><div class="error-message-popover"><img src="assets/img/sad-otter.png"><h1>Bummer!</h2> Looks like the API is having trouble keeping up with Otter. You can still browse, but be aware that we may not be able to retrieve information for some apps.<span class="error-close"><span></div></div>');
    }

    $('.' + errorId + ' .error-close').on('tap', function() {
      $(this).parent().remove();
    });

    $('.popover .error-close').on('tap', function() {
      $(this).parent().parent().remove();
    });

    setTimeout(function() {
      $('.' + errorId).addClass('show-error');
    }, 400);
    setTimeout(function() {
      $('.' + errorId).removeClass('show-error');
      setTimeout(function() {
        $('.' + errorId).remove()
      }, 300);
    }, 12000);
  }

  return {
    throwError: _throwError
  };
});