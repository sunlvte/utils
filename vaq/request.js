/**
 * ajax请求
 */
define(function(require) {
	var $ = require('jquery');
	var Popup = require('./popup');
	var Mask = require('./mask');

	var loader = $('<div class="ui active loader fixed-i"></div>');

	var tip = function(html, obj) {
    let delayTime = 2000;

    if (obj === true) {
      html = '<div class="tip-text-success"><i class="ui icon check circle big"></i> ' + html + '</div>';
      delayTime = 1000;
    } else if (obj === false) {
      html = '<div class="tip-text-error"><i class="ui icon warning circle big"></i> ' + html + '</div>';
    }

    return new Popup($.extend({isMask: false, html: html, delayTime: delayTime, autoClose: true,css: {zIndex:9998}}, obj));
  };

	/**
	 * ajax操作
	 *
	 * @param {object} ajax参数，同等于 $.ajax()参数
	 * @param {fn} 成功后执行方法
	 * @param {fn} 失败后执行方法
	 * @example
	 * base.request({type: 'POST'}, function(res) {
	 * 	console.log(res)
	 * })
	 *
	 * mask: {target:, loading: }
	 *
	 * @return Pormise
	 */
	var request = function() {
		$.ajaxPrefilter(function(options, originalOptions, jqXhr) {
			var content = $('meta[name="csrf-token"]').attr('content');

			content && jqXhr.setRequestHeader('X-CSRF-TOKEN', content);
		});

		return function(options, done, fail) {
			options = Object.assign({
				dataType: 'json',
				type: 'get',
				cache: false,
				isThrowDoneError: true, // 请求成功，code !== 0 也不报错
				isThrowFailError: true // 请求失败也不报错
			}, options);

			var mask;

			if (options.mask) {
				mask = new Mask(options.mask.target, options.mask).render();

				delete options.mask;
			}

			if (options.loading) {
				$('body').append(loader);
			}

			var isThrowDoneError = options.isThrowDoneError;
			var isThrowFailError = options.isThrowFailError;

			return $.ajax(options)
				.done(function(res) {
					res = res || {};

          // 用户未登录
					if (+res.code === 507) {
            window.location.href = '/login';
            return;
          }

					if (+res.code !== 200) {
						isThrowDoneError && tip(res.msg || '网络有误，请稍后重试！', false);
						return;
					}

					done(res);
				})
				.fail(function(res) {
					if (fail) {
						return fail(res);
					}

					isThrowFailError && tip(res.msg || '网络有误，请稍后重试！', false);
				})
				.always(function() {
          options.loading && loader.remove();
          mask && mask.remove();
				});
		};
	};

	return request();
});
