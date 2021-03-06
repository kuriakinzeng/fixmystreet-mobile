(function(FMS, Backbone, _, $) {
    _.extend( FMS, {
        Report: Backbone.Model.extend({
            urlRoot: CONFIG.FMS_URL + 'report/ajax',

            defaults: {
                lat: 0,
                lon: 0,
                title: '',
                details: '',
                may_show_name: '',
                category: '',
                phone: '',
                pc: '',
                file: ''
            },

            sync: function(method, model, options) {
                switch (method) {
                    case 'update':
                    case 'create':
                        this.post(model,options);
                        break;
                    case 'read':
                        Backbone.ajaxSync(method, model, options);
                        break;
                    default:
                        return true;
                }
            },

            parse: function(res) {
                if ( res.report && res.report.latitude ) {
                    return {
                        lat: res.report.latitude,
                        lon: res.report.longitude,
                        title: res.report.title,
                        details: res.report.detail,
                        photo: res.report.photo && res.report.photo.url ? CONFIG.FMS_URL + res.report.photo.url : null,
                        meta: res.report.meta,
                        confirmed_pp: res.report.confirmed_pp,
                        created_pp: res.report.created_pp,
                        category: res.report.category,
                        state: res.report.state,
                        state_t: res.report.state_t,
                        is_fixed: res.report.is_fixed,
                        used_map: res.report.used_map,
                        update_time: res.updates ? res.updates.update_pp : null,
                        update: res.updates ? res.updates.details : null
                    };
                }
                return false;
            },

            post: function(model,options) {

                var params = {
                    service: device.platform,
                    title: model.get('title'),
                    detail: model.get('details'),
                    category: model.get('category'),
                    lat: model.get('lat'),
                    lon: model.get('lon'),
                    pc: model.get('pc'),
                    may_show_name: model.get('may_show_name'),
                    used_map: 1,
                    name: model.get('name') || model.get('user').get('name'),
                    email: model.get('email') || model.get('user').get('email'),
                    phone: model.get('phone'),
                    fms_extra_title: model.get('user').get('title')
                };

                var extra_fields = model.get('extra_details');
                if ( extra_fields && extra_fields.length > 0 ) {
                    for ( var i = 0; i < extra_fields.length; i++ ) {
                        params[extra_fields[i]] = model.get(extra_fields[i]);
                    }
                }

                if ( model.get('submit_clicked') == 'submit_sign_in' ) {
                    params.submit_sign_in = 1;
                    params.password_sign_in = model.get('user').get('password');
                    params.remember_me = 1;
                } else {
                    params.password_register = model.get('user').get('password') || '';
                    params.submit_register = 1;
                }

                var that = this;
                if ( model.get('file') && model.get('file') !== '' ) {
                    var fileUploadSuccess = function(r) {
                        $.mobile.loading('hide');
                        if ( r.response ) {
                            var data;
                            try {
                                data = JSON.parse( decodeURIComponent(r.response) );
                            }
                            catch(err) {
                                data = {};
                            }
                            if ( data.success ) {
                                that.success = 1;
                                that.trigger('sync', that, data, options);
                            } else if ( data.errors ) {
                                that.trigger('invalid', that, data, options);
                            } else {
                                that.trigger('error', that, FMS.strings.report_send_error, options);
                            }
                        } else {
                            that.trigger('error', that, FMS.strings.report_send_error, options);
                        }
                    };

                    var fileUploadFail = function() {
                        $.mobile.loading('hide');
                        that.trigger('error', that, FMS.strings.report_send_error, options);
                    };

                    fileURI = model.get('file');

                    var fileOptions = new FileUploadOptions();
                    fileOptions.fileKey="photo";
                    fileOptions.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
                    fileOptions.mimeType="image/jpeg";
                    fileOptions.params = params;
                    fileOptions.chunkedMode = false;

                    var ft = new FileTransfer();
                    $.mobile.loading('show');
                    ft.upload(fileURI, CONFIG.FMS_URL + "report/new/mobile", fileUploadSuccess, fileUploadFail, fileOptions);
                } else {
                    $.ajax( {
                        url: CONFIG.FMS_URL + "report/new/mobile",
                        type: 'POST',
                        data: params,
                        dataType: 'json',
                        timeout: 30000,
                        success: function(data) {
                            if ( data.success ) {
                                that.success = 1;
                                that.trigger('sync', that, data, options);
                            } else {
                                that.trigger('invalid', that, data, options);
                            }
                        },
                        error: function (data, status, errorThrown ) {
                            console.log(FMS.strings.report_send_error);
                            that.trigger('error', that, data, status, errorThrown );
                        }
                    } );
                }
            },

            getLastUpdate: function(time) {
                if ( time ) {
                    props.time = time;
                }

                if ( !props.time ) {
                    return '';
                }

                var t;
                if ( typeof props.time === 'String' ) {
                    t = new Date( parseInt(props.time, 10) );
                } else {
                    t = props.time;
                }
            }
        })
    });
})(FMS, Backbone, _, $);
