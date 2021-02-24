"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeDuration = function (event) {
    var minutes = Math.floor((+new Date(event.endsAt) - +new Date(event.startsAt)) / 60 / 1000);
    return "" + ("0" + Math.floor(minutes / 60)).slice(-2) + ("0" + minutes % 60).slice(-2);
};
var makeTime = function (time) { return new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, ""); };
var makeUrl = function (base, query, outlook) {
    if (outlook === void 0) { outlook = false; }
    return Object.keys(query).reduce(function (accum, key, index) {
        var value = query[key];
        if (value === null || value === undefined) {
            return accum;
        }
        // if array then flatten down to csv
        var stringValue = Array.isArray(value) ? value.join(",") : value;
        // outlook didn't like our fix to space encoding used in fixOutlookText in location field
        var encodedStringValue = outlook && key !== "location" ? fixOutlookText(encodeURIComponent(stringValue)) : encodeURIComponent(stringValue);
        return "" + accum + (index === 0 ? "?" : "&") + key + "=" + encodedStringValue;
    }, base);
};
var fixOutlookText = function (urlEncoded) {
    // https://github.com/connect4app/add-to-calendar/issues/3
    // https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/issues/20
    urlEncoded = urlEncoded.replace(/%20/g, "%26%2332%3B");
    // https://github.com/connect4app/add-to-calendar/issues/2
    urlEncoded = urlEncoded.replace(/\(/g, escape("["));
    urlEncoded = urlEncoded.replace(/\)/g, escape("]"));
    // https://github.com/connect4app/add-to-calendar/issues/1
    urlEncoded = urlEncoded.replace(/\+/g, escape("+"));
    return urlEncoded;
};
// some unoffical references for URL format:
// https://stackoverflow.com/questions/22757908/what-parameters-are-required-to-create-an-add-to-google-calendar-link
// https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/master/services/google.md
var makeGoogleCalendarUrl = function (event) { return makeUrl("https://calendar.google.com/calendar/render", {
    action: "TEMPLATE",
    dates: makeTime(event.startsAt) + "/" + makeTime(event.endsAt),
    location: event.location,
    text: event.name,
    details: event.details,
    add: event.addresses
}); };
var makeOutlookCalendarUrl = function (event) {
    // if (event.addresses) {
    //   event.addresses.map((e) => { return fixOutlookEmail(e) });
    // }
    //
    // if (event.details) {
    //   event.details = fixOutlookText(event.details);
    // }
    //
    // if (event.name) {
    //   event.name = fixOutlookText(event.name);
    // }
    return makeUrl("https://outlook.live.com/calendar/0/deeplink/compose", {
        startdt: event.startsAt,
        enddt: event.endsAt,
        subject: event.name,
        location: event.location,
        body: event.details,
        to: event.addresses,
        allday: false,
        uid: new Date().getTime().toString(),
    }, true);
};
// const makeOutlookCalendarUrl = (event: CalendarEvent) => {
//   makeUrl("https://outlook.live.com/owa", {
//     rru: "addevent",
//     startdt: event.startsAt,
//     enddt: event.endsAt,
//     subject: fixOutlookText(event.name),
//     location: event.location,
//     body: fixOutlookText(event.details),
//     to: event.addresses.map((e) => {fixOutlookEmail(e)}),
//     allday: false,
//     uid: new Date().getTime().toString(),
//     path: "/calendar/view/Month",
//   });
// }
var makeYahooCalendarUrl = function (event) { return makeUrl("https://calendar.yahoo.com", {
    v: 60,
    view: "d",
    type: 20,
    title: event.name,
    st: makeTime(event.startsAt),
    dur: makeDuration(event),
    desc: event.details,
    in_loc: event.location
}); };
var makeICSCalendarUrl = function (event) {
    var components = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT"
    ];
    // In case of SSR, document won't be defined
    if (typeof document !== "undefined") {
        components.push("URL:" + document.URL);
    }
    components.push("DTSTART:" + makeTime(event.startsAt), "DTEND:" + makeTime(event.endsAt), "SUMMARY:" + event.name, "DESCRIPTION:" + event.details, "LOCATION:" + event.location, "END:VEVENT", "END:VCALENDAR");
    return encodeURI("data:text/calendar;charset=utf8," + components.join("\n"));
};
var makeUrls = function (event) { return ({
    google: makeGoogleCalendarUrl(event),
    outlook: makeOutlookCalendarUrl(event),
    yahoo: makeYahooCalendarUrl(event),
    ics: makeICSCalendarUrl(event)
}); };
exports.default = makeUrls;
