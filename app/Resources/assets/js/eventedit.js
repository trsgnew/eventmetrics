grantmetrics.eventedit = {};

$(function () {
    // Only run on event-new, edit and copy pages (all event pages except -show).
    if (!$('body').hasClass('event') || $('body').hasClass('event-show')) {
        return;
    }

    // Attempt to default the timezone to the user's timezone when creating a new event.
    if ($('body').hasClass('event-new')) {
        var timezone = 'UTC';
        try {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if ($("#event_timezone option[value='" + timezone + "']").length) {
                $('#event_timezone').val(timezone);
            }
        } catch (_error) {
        }
    }

    grantmetrics.eventedit.setupWikiInputs();
    grantmetrics.eventedit.setupDateRangePicker();
});

/**
 * Set up wiki autocompletion and listeners for the special wiki links (e.g. "All Wikipedias").
 */
grantmetrics.eventedit.setupWikiInputs = function () {
    // Setup the add/remove wiki fields.
    grantmetrics.application.setupAddRemove('event', 'wiki');

    grantmetrics.application.populateValidWikis().then(function (validWikis) {
        $('.event__wikis').on('focus', '.event-wiki-input', function () {
            if ($(this).data().typeahead) {
                return;
            }

            $(this).typeahead({
                source: validWikis
            });
        });
    });

    /**
     * Listener for special wiki options.
     */
    $('.special-wiki').on('click', function (e) {
        e.preventDefault();

        var $lastWiki = $('.event__wikis').find('input').last();

        if ($lastWiki.val().trim() !== '') {
            $('.add-wiki').trigger('click');
            $lastWiki = $('.event__wikis').find('input').last();
        }

        $lastWiki.val($(e.target).data('value'));
    });
};

/**
 * Setup the date range picker on the event new/edit page. The user sees a single input field containing the date range.
 * Hidden start/end date inputs are updated when the date range is changed, as this is how the server wants it.
 */
grantmetrics.eventedit.setupDateRangePicker = function () {
    var startDate = moment($('#event_start').val()).utc(),
        endDate = moment($('#event_end').val()).utc();

    // Set defaults if invalid or blank -- next week.
    startDate = startDate.isValid() ? startDate : moment().add(7, 'days').startOf('week');
    endDate = endDate.isValid() ? endDate : moment().add(7, 'days').endOf('week');

    $('#event_time').daterangepicker({
        timePicker: true,
        timePicker24Hour: grantmetrics.dateLocales.is24HourFormat(),
        startDate: startDate,
        endDate: endDate,
        locale: {
            format: grantmetrics.dateLocales.getLocaleDatePattern() + ' ' + grantmetrics.dateLocales.getLocaleTimePattern(),
            applyLabel: $.i18n('apply'),
            cancelLabel: $.i18n('cancel'),
            customRangeLabel: $.i18n('custom-range'),
            daysOfWeek: grantmetrics.dateLocales.getWeekdayNames(),
            monthNames: grantmetrics.dateLocales.getMonthNames()
        }
    });

    // Populate hidden start/end datetime fields on form submission.
    $('#event_form').on('submit', function () {
        var rangeData = $('#event_time').data().daterangepicker;
        $('#event_start').val(rangeData.startDate.format('YYYY-MM-DDTHH:mm:00-00:00'));
        $('#event_end').val(rangeData.endDate.format('YYYY-MM-DDTHH:mm:00-00:00'));
    });
};
