# soundcloud-chrome-extension
## What is this?
A condensed music player for Soundcloud, built as a Chrome extension.

## Motivation
As a user, I want to have access to Soundcloud and its resources wherever I am in Chrome.

## Features (so far)
* Simple search - query by typing something in the text box
* Track pagination
* Current song display
* Quick access to Soundcloud.com + previous tab with hotkeys

## Design/UX Goals
* To create a non-disruptive music player that does not require constant tab-switching
* To create a complentary application that *enhances* the experience of using soundcloud.com, not to
    replace it

## Resources and References
* [Chrome Extensions](developer.chrome.com/extensions/)
* [Soundcloud API](https://developers.soundcloud.com/docs/api/)

## Technology
* [Javascript/jQuery](https://www.javascript.com/)
* [Bootstrap 3](http://getbootstrap.com/)
* [Sass](http://sass-lang.com/)
* [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
 
## Contribute
Whether it be bug fixes, feature implementations, or comments, all contributions are welcome!

# Setup
You will need to [register](http://soundcloud.com/you/apps/new) for an API key to use this extension in development.
Then, clone this repo and create a JSON file called `config.json`, with the contents looking like:

```
{
    soundcloud_client_id : "your_client_id"
}
```

To actually load this extension into Chrome as a developer, go to chrome://extensions/ in your Chrome browser,
    and click "Load unpacked extension...". Select the directory of the project and you should be ready to go!

### Suggestions
* Set the hot-keys! On the chrome://extensions/ page, scroll to the bottom and click 'Keyboard Shortcuts'
* For development purposes, you can keep the popup page open if you have the Devtools open for that popup



