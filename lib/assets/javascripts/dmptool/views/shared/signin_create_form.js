/* eslint-env browser */ // This allows us to reference 'window' below
import * as Cookies from 'js-cookie';
import ariatiseForm from '../../../utils/ariatiseForm';
import initAutoComplete from '../../../utils/autoComplete';
import { isObject, isString } from '../../../utils/isType';
import { renderNotice, renderAlert } from '../../../utils/notificationHelper';
import {
  SHIBBOLETH_DISCOVERY_SERVICE_HIDE_LIST,
  SHIBBOLETH_DISCOVERY_SERVICE_SHOW_LIST,
} from '../../../constants';

$(() => {
  initAutoComplete();
  ariatiseForm({ selector: '#signin_create_form' });
  ariatiseForm({ selector: '#shibboleth_ds' });

  const email = Cookies.get('dmproadmap_email');

  // Signin remember me
  // -----------------------------------------------------
  // If the user's email was stored in the browser's cookies the pre-populate the field
  if (email && email !== '') {
    $('#signin_create_form #remember_email').attr('checked', 'checked');
    $('#signin_create_form #user_email').val(email);
  }

  // When the user checks the 'remember email' box store the value in the browser storage
  $('#signin_create_form #remember_email').click((e) => {
    if ($(e.currentTarget).is(':checked')) {
      Cookies.set('dmproadmap_email', $('#signin_create_form #user_email').val(), { expires: 14 });
    } else {
      Cookies.remove('dmproadmap_email');
    }
  });

  // If the email is changed and the user has asked to remember it update the browser storage
  $('#signin_create_form #user_email').change((e) => {
    if ($('#signin_create_form #remember_email').is(':checked')) {
      Cookies.set('dmproadmap_email', $(e.currentTarget).val(), { expires: 14 });
    }
  });

  // Signin / Create Account form toggle
  // -----------------------------------------------------
  // handle toggling between shared signin/create account forms
  const toggleSignInCreateAccount = (signin = true) => {
    const signinTab = $('[data-target="#sign-in-form-tab"]');
    const createTab = $('[data-target="#create-account-form-tab"]');
    if (signin) {
      $('#signin_create_form').attr('action', signinTab.attr('data-action')).attr('method', signinTab.attr('data-method'));
      $('[data-target="#sign-in-form-tab"]').closest('li').addClass('active');
      $('[data-target="#create-account-form-tab"]').closest('li').removeClass('active');
      $('#signin_create_form .create-account-fields').addClass('hide');
      $('#signin_create_form .signin-fields').removeClass('hide');
    } else {
      $('#signin_create_form').attr('action', createTab.attr('data-action')).attr('method', createTab.attr('data-method'));
      $('[data-target="#sign-in-form-tab"]').closest('li').removeClass('active');
      $('[data-target="#create-account-form-tab"]').closest('li').addClass('active');
      $('#signin_create_form .create-account-fields').removeClass('hide');
      $('#signin_create_form .signin-fields').addClass('hide');
    }
  };
  const clearLogo = () => {
    $('#org-sign-in-logo').html('');
    $('#user_org_id').val('');
  };
  $('#access-control-tabs [data-target="#sign-in-form-tab"]').click(() => {
    toggleSignInCreateAccount(true);
    return false;
  });
  $('#access-control-tabs [data-target="#create-account-form-tab"]').click(() => {
    toggleSignInCreateAccount(false);
    return false;
  });
  $('#show-create-account-via-shib-ds, #show-create-account-form').click(() => {
    clearLogo();
    toggleSignInCreateAccount(false);
  });
  $('#show-sign-in-form').click(() => {
    clearLogo();
    toggleSignInCreateAccount(true);
  });
  toggleSignInCreateAccount();

  // Handling ldap username lookup here to take advantage of shared signin-create logic
  $('form#forgot_email_form').on('ajax:success', (e, data) => {
    if (isObject(data) && isString(data.msg)) {
      renderNotice(data.msg);
      if (data.email === '' || data.email === null) {
        //
      } else {
        toggleSignInCreateAccount(true);
        $('#sign-in-create-account').modal('show');
        $('input[id=user_email]').val(data.email);
      }
    }
  });
  $('form#forgot_email_form').on('ajax:error', (e, xhr) => {
    const error = xhr.responseJSON;
    if (isObject(error) && isString(error)) {
      renderAlert(error.msg);
    }
  });

  // Shibboleth DS
  // -----------------------------------------------------
  const logoSuccess = (data) => {
    // Render the html in the org-sign-in modal
    if (isObject(data) && isObject(data.org) && isString(data.org.html)) {
      $('#org-sign-in-logo').html(data.org.html);
      $('#user_org_id').val(data.org.id);
      toggleSignInCreateAccount(true);
      $('#sign-in-create-account').modal('show');
    }
  };
  const logoError = () => {
    // There was an ajax error so just route the user to the sign-in modal
    // and let them sign in as a Non-Partner Institution
    $('#access-control-tabs a[data-target="#sign-in-form"]').tab('show');
  };

  $('.org-sign-in').click((e) => {
    const target = $(e.target);
    $('#org-sign-in').html('');
    $.ajax({
      method: 'GET',
      url: target.attr('href'),
    }).done((data) => {
      logoSuccess(data);
    }, logoError);
    e.preventDefault();
  });

  $('#show_list').click((e) => {
    e.preventDefault();
    if ($('#full_list').is('.hide')) {
      $('#full_list').removeClass('hide').attr('aria-hidden', 'false');
      $(e.currentTarget).html(SHIBBOLETH_DISCOVERY_SERVICE_HIDE_LIST);
    } else {
      $('#full_list').addClass('hide').attr('aria-hidden', 'true');
      $(e.currentTarget).html(SHIBBOLETH_DISCOVERY_SERVICE_SHOW_LIST);
    }
  });

  // When the user clicks 'Go' click the corresponding link from the list
  // of all orgs
  $('#org-select-go').click((e) => {
    e.preventDefault();
    const id = $('#org_id').val();
    if (isString(id)) {
      const link = $(`a[data-content="${id}"]`);
      if (isObject(link)) {
        // If the org doesn't have a shib setup then display the org sign in modal
        if (link.is('.org-sign-in')) {
          link.click();
        } else {
          window.location.replace(link.attr('href'));
        }
      }
    }
  });
});

