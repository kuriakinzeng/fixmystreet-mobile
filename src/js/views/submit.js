(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitView: FMS.FMSView.extend({
            template: 'submit',
            id: 'submit-page',
            prev: 'details',
            nopassword: 0,

            events: {
                'pagehide': 'destroy',
                'pagebeforeshow': 'beforeDisplay',
                'pageshow': 'afterDisplay',
                'vclick .ui-btn-left': 'onClickButtonPrev',
                'vclick .ui-btn-right': 'onClickButtonNext',
                'vclick #submit_signed_in': 'onClickSubmit',
                'vclick #submit_sign_in': 'onClickSubmit',
                'vclick #submit_register': 'onClickSubmit'
            },

            render: function(){
                if ( !this.template ) {
                    console.log('no template to render');
                    return;
                }
                template = _.template( tpl.get( this.template ) );
                if ( this.model ) {
                    this.$el.html(template({ model: this.model.toJSON(), user: FMS.currentUser.toJSON(), nopassword: this.nopassword }));
                } else {
                    this.$el.html(template());
                }
                this.afterRender();
                return this;
            },

            onClickSubmit: function(e) {
                // in case we are getting here from a form submission
                e.preventDefault();
                this.beforeSubmit();

                if ( this.validate() ) {
                    this.model.set('user', FMS.currentUser);
                    if ( FMS.isOffline ) {
                        this.navigate( 'save_offline' );
                    } else {
                        this.report = new FMS.Report( this.model.toJSON() );
                        this.listenTo( this.report, 'sync', this.onReportSync );
                        this.listenTo( this.report, 'invalid', this.onReportInvalid );
                        this.listenTo( this.report, 'error', this.onReportError );
                        this.report.save();
                    }
                }
            },

            onReportSync: function(model, resp, options) {
                if ( model.success !== 1 ) {
                    return;
                }
                this.stopListening();
                this.afterSubmit();
                if ( FMS.currentUser ) {
                    FMS.currentUser.save();
                }
                if (resp.report) {
                    this.report.set('site_id', resp.report);
                    this.report.set('site_url', CONFIG.FMS_URL + '/report/' + resp.report);
                } else {
                    this.report.set('email_confirm', 1);
                }
                var reset = FMS.removeDraft( model.id, true);
                var that = this;
                reset.done( function() { that.onRemoveDraft(); } );
                reset.fail( function() { that.onRemoveDraft(); } );
            },

            onRemoveDraft: function() {
                FMS.clearCurrentDraft();
                FMS.createdReport = this.report;
                this.navigate( 'sent' );
            },

            onReportInvalid: function(model, err, options) {
                if ( !this._handleInvalid( model, err, options ) ) {
                    var errors = err.errors;
                    var errorList = '<ul><li class="plain">' + FMS.strings.invalid_report + '</li>';
                    var validErrors = [ 'password', 'category', 'name' ];
                    for ( var k in errors ) {
                        if ( validErrors.indexOf(k) >= 0 || errors[k].match(/required/) ) {
                            if ( k === 'password' ) {
                                error = FMS.strings.password_problem;
                            } else if ( k !== '') {
                                error = errors[k];
                            }
                            errorList += '<li>' + error + '</li>';
                        }
                    }
                    errorList += '</ul>';
                    $('#errors').html(errorList).show();
                }
            },

            onReportError: function(model, err, options) {
                if ( err.errors ) {
                    this.displayAlert(FMS.strings.sync_error + ': ' + err.errors);
                } else {
                    this.displayAlert(FMS.strings.unknown_sync_error);
                }
            },

            beforeSubmit: function() {},
            afterSubmit: function() {},

            _handleInvalid: function() {
                return false;
            },

            _destroy: function() {
                this.stopListening();
            }
        })
    });
})(FMS, Backbone, _, $);


(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitEmailView: FMS.SubmitView.extend({
            template: 'submit_email',
            id: 'submit-email-page',
            prev: 'details',

            events: {
                'pagehide': 'destroy',
                'pagebeforeshow': 'beforeDisplay',
                'pageshow': 'afterDisplay',
                'vclick .ui-btn-left': 'onClickButtonPrev',
                'vclick #set_password': 'onClickSetPassword',
                'vclick #have_password': 'onClickPassword',
                'vclick #email_confirm': 'onClickConfirm'
            },

            validate: function() {
                this.clearValidationErrors();
                var isValid = 1;

                var email = $('#form_email').val();
                if ( !email ) {
                    isValid = 0;
                    this.validationError('form_email', FMS.validationStrings.email.required);
                // regexp stolen from jquery validate module
                } else if ( ! /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(email) ) {
                    isValid = 0;
                    this.validationError('form_email', FMS.validationStrings.email.email);
                }

                return isValid;
            },

            onClickSetPassword: function(e) {
                e.preventDefault();
                if ( this.validate() ) {
                    this.model.set('submit_clicked', 'submit_register');
                    FMS.currentUser.set('email', $('#form_email').val());
                    this.navigate( 'submit-set-password' );
                }
            },

            onClickPassword: function(e) {
                e.preventDefault();
                if ( this.validate() ) {
                    FMS.currentUser.set('email', $('#form_email').val());
                    this.navigate( 'submit-password' );
                }
            },

            onClickConfirm: function(e) {
                e.preventDefault();
                if ( this.validate() ) {
                    FMS.currentUser.set('email', $('#form_email').val());
                    this.navigate( 'submit-name' );
                }
            },

            _destroy: function() {}
        })
    });
})(FMS, Backbone, _, $);

(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitNameView: FMS.SubmitView.extend({
            template: 'submit_name',
            id: 'submit-name-page',
            prev: 'submit-email',
            nopassword: 1,

            events: {
                'pagehide': 'destroy',
                'pagebeforeshow': 'beforeDisplay',
                'pageshow': 'afterDisplay',
                'vclick .ui-btn-left': 'onClickButtonPrev',
                'vclick #send_confirm': 'onClickSubmit'
            },

            initialize: function() {
                console.log('submit name initalize');
                this.listenTo(this.model, 'sync', this.onReportSync );
                this.listenTo( this.model, 'error', this.onReportError );
            },

            validate: function() {
                this.clearValidationErrors();
                var isValid = 1;

                var name = $('#form_name').val();
                if ( !name ) {
                    isValid = 0;
                    this.validationError('form_name', FMS.validationStrings.name.required );
                } else {
                    var validNamePat = /\ba\s*n+on+((y|o)mo?u?s)?(ly)?\b/i;
                    if ( name.length < 6 || !name.match( /\S/ ) || name.match( validNamePat ) ) {
                        isValid = 0;
                        this.validationError('form_name', FMS.validationStrings.name.validName);
                    }
                }

                if ( this.model.get('title_list') && this.model.get('title_list').length > 0 ) {
                    if ( $('#form_title').val() === '' ) {
                        this.validationError('form_title', FMS.strings.required);
                        isValid = 0;
                    }
                }

                return isValid;
            },

            beforeSubmit: function() {
                this.model.set('name', $('#form_name').val());
                this.model.set('phone', $('#form_phone').val());
                this.model.set('may_show_name', $('#form_may_show_name').val());
                if ( this.model.get('title_list') && this.model.get('title_list').length > 0 ) {
                    FMS.currentUser.set('title', $('#form_title').val());
                }
            }
        })
    });
})(FMS, Backbone, _, $);

(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitNameSetPasswordView: FMS.SubmitNameView.extend({
            template: 'submit_name',
            id: 'submit-name-page-set-password',
            prev: 'submit-set-password',
            nopassword: 0
        })
    });
})(FMS, Backbone, _, $);

(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitPasswordView: FMS.SubmitView.extend({
            template: 'submit_password',
            id: 'submit-password-page',
            prev: 'submit-email',

            events: {
                'pagehide': 'destroy',
                'pagebeforeshow': 'beforeDisplay',
                'pageshow': 'afterDisplay',
                'vclick .ui-btn-left': 'onClickButtonPrev',
                'vclick #report': 'onClickSubmit',
                'vclick #confirm_name': 'onClickSubmit',
                'submit #passwordForm': 'onClickSubmit'
            },

            initialize: function() {
                this.listenTo(this.model, 'sync', this.onReportSync );
                this.listenTo( this.model, 'error', this.onReportError );
            },

            validate: function() {
                var isValid = 1;

                if ( !$('#form_password').val() ) {
                    isValid = 0;
                    this.validationError('form_password', FMS.validationStrings.password );
                }

                return isValid;
            },

            beforeSubmit: function() {
                $('#report').focus();
                if ( $('#form_name').val() ) {
                    this.model.set('submit_clicked', 'submit_register');
                    this.model.set('phone', $('#form_phone').val());
                    this.model.set('name', $('#form_name').val());
                    this.model.set('may_show_name', $('#form_may_show_name').val());
                } else {
                    // if this is set then we are registering a password
                    if ( ! this.model.get('submit_clicked') ) {
                        this.model.set('submit_clicked', 'submit_sign_in');
                    }
                    FMS.currentUser.set('password', $('#form_password').val());
                }
            },

            afterSubmit: function() {
                FMS.isLoggedIn = 1;
            },

            _handleInvalid: function(model, err, options) {
                if ( err.check_name ) {
                    $('#form_name').val(err.check_name);
                    $('#password_row').hide();
                    $('#check_name').show();
                    $('#confirm_name').focus();
                    return true;
                }
                return false;
            }

        })
    });
})(FMS, Backbone, _, $);

(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitSetPasswordView: FMS.SubmitPasswordView.extend({
            template: 'submit_set_password',
            id: 'submit-set-password-page',
            prev: 'submit-email',
            next: 'submit-name-set-password',

            events: {
                'pagehide': 'destroy',
                'pagebeforeshow': 'beforeDisplay',
                'pageshow': 'afterDisplay',
                'vclick .ui-btn-left': 'onClickButtonPrev',
                'vclick #continue': 'onClickContinue',
                'submit #passwordForm': 'onClickContinue'
            },

            onClickContinue: function(e) {
                e.preventDefault();
                $('#continue').focus();
                if ( ! this.model.get('submit_clicked') ) {
                    this.model.set('submit_clicked', 'submit_sign_in');
                }
                FMS.currentUser.set('password', $('#form_password').val());
                this.navigate( this.next );
            }
        })
    });
})(FMS, Backbone, _, $);

(function (FMS, Backbone, _, $) {
    _.extend( FMS, {
        SubmitConfirmView: FMS.SubmitView.extend({
            template: 'submit_confirm',
            id: 'submit-confirm-page',
            prev: 'details',

            events: {
                'pagehide': 'destroy',
                'pagebeforeshow': 'beforeDisplay',
                'pageshow': 'afterDisplay',
                'vclick .ui-btn-left': 'onClickButtonPrev',
                'vclick #report': 'onClickSubmit'
            },

            validate: function() {
                this.clearValidationErrors();
                var isValid = 1;

                var name = $('#form_name').val();
                if ( !name ) {
                    isValid = 0;
                    this.validationError('form_name', FMS.validationStrings.name.required );
                } else {
                    var validNamePat = /\ba\s*n+on+((y|o)mo?u?s)?(ly)?\b/i;
                    if ( name.length < 6 || !name.match( /\S/ ) || name.match( validNamePat ) ) {
                        isValid = 0;
                        this.validationError('form_name', FMS.validationStrings.name.validName);
                    }
                }

                return isValid;
            },

            beforeSubmit: function() {
                this.model.set('name', $('#form_name').val());
                this.model.set('phone', $('#form_phone').val());
                this.model.set('may_show_name', $('#form_may_show_name').val());
                this.model.set('submit_clicked', 'submit_register');
            },

            onReportError: function(model, err, options) {
                // TODO: this is a temporary measure which should be replaced by a more
                // sensible login mechanism
                if ( err.check_name ) {
                    this.onClickSubmit();
                } else {
                    if ( err.errors && err.errors.password ) {
                        this.validationError('form_password', err.errors.password );
                    }
                }
            }
        })
    });
})(FMS, Backbone, _, $);
