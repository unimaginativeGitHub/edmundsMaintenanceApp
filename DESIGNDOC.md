# Car Maintenance App Design Document

## Structure

The basic structure of the single page app is very simple.  One `index.html` to act as a gateway for the application as well as a vessel to pull in resources and to provide overall layout. In this case `bootstrap` and `jquery` are being loaded in for base styling and tools. Custom styling from the `style.css` document, and javascript listeners and functions from the `actions.js` script.

## Improvements

The app, while it gets the job done for the most part, has a lot of room for improvement. Here is a brief list of improvements that could be made:

- Web server to handle data processing and to hide the api key from the client
- A more responsive and data-driven UI/UX
- More control over the data the user is requesting
- Better selection and input validation
- Better vetting/handling responses from the API
- Better error handling

#### Responsive and Data Driven UX
Currently the layout breaks down to a 35% to 65% horizontal split of the window with minimums on the side bar and results panel.  Also, the html is being generated procedurally with strings and javascript objects. Both of these things could be better handled by more responsive components and data handlers.  Something like [React.js](https://facebook.github.io/react/) partnered with [Redux](http://redux.js.org) or [Relay](https://facebook.github.io/relay/) could handle compact and dynamic component construction that reflect a backside store that can change at it's own pace.

#### Web Server
Hiding the API key is important, but having a web server also allows you to serve the application more generically by transpiling using tools such as [Babel](https://babeljs.io). To build the server, something like [Node.js](https://nodejs.org/en/) partnered with [Express](http://expressjs.com) would be good. Code validation and testing would also be a good addition, a [Mocha](https://mochajs.org) - [Chai](http://chaijs.com) - [Sinon](http://sinonjs.org) grouping with [Istanbul](https://github.com/gotwarlost/istanbul) for good measure, depending on scope of project and potential for growth.

#### Better Validation
Selection validation would be a great improvement. As it stands, the app ensures that a selection has been made for each field before the final request is made, however, a better job could be done of informing the user of *which* field(s) have not been filled in or selected. Additional tools such as [Messenger](http://github.hubspot.com/messenger/) could be used, but even some simple listeners providing simple errors like the ones already in use would be appropriate.

#### Better API Response Handling
In most cases the app is handling the data just as it arrives, sometimes checking for presence of data, but not always. Errors and data presence should be handled and success or user feedback given in all cases rather than being assumed. Data integrity from the API also needs to be checked; several times objects, usually engines or transmissions would come back from the API with extraneous or multiple identical entries. Also, errors from failed responses need to be handled, for the most part integrity and success are being assumed and that should not be the standard behavior. Progress notification to the user would also be a good touch.

## Summary

Given more time and resources, the app should be rewritten to use:
- A web server in order to provide server side resources (ie transpiler) and api key hiding.
- React.js components with a client side data handler like Redux.
- Better error handling and validation tools (both user input and response validation/handling).
- Improved data updating and display to the user (likely handled with React/Redux)
