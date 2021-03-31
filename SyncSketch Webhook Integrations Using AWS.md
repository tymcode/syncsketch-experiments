# SyncSketch Webhook Integrations Using AWS

SyncSketch has introduced support for *webhooks*, which allows users to receive notifications of various events like approval status changes or new item uploads.  These webhooks can be used to post information into a chat channel, send a text message, or any other method of the user's choosing.

The concept behind webhooks is very simple, and from a coding standpoint isn't difficult either.  The idea is that every time a supported event occurs in your SyncSketch account, a message is sent to a URL that you provide.  Your job is to make a function at that URL listen for the message and do something useful with it.

The easiest way to build your listener is by using Amazon Web Services, which lets you set up a function that has a URL.  This way, you don't have to set up, administer or maintain a public-facing server.  We will be using primarily an AWS service called Lambda for the functions

This post will discuss the rquired code and the AWS configuration details.  We will set up an integration with a chat application Discord, because it's simple and free, but the AWS configuration could be adapted to integrate it with anything that has an API, or has webhook support itself.  The actual code is simple; there isn't much to it. The main thing we have to do is set up the AWS function.

Discord supports webhooks, in the sense that you can start your own server and build a URL that will post incoming messages into a chat channel on that server. Discord expects incoming messages to be in a particular format, but SyncSketch does not currently allow users to specify the output format of its webhooks.  So in this case we are going to create an intermediary function that listens for the SyncSketch webhooks and uses the information in that message to build a new message in the right format for Discord, then sends its own webhook to Discord.

[TOC]

The sequence of steps is as follows:

1. Get an AWS account
2. Set up a Discord server with a Webhook
3. Write an AWS Lambda function that posts into the Discord server
4. Set up a listener in the Lambda function
5. Set up an API gateway for SyncSketch to send messages through
6. Set up a webhook in SyncSketch

If you've never done these things before: Every one of these steps is easier than it sounds.

## Getting your AWS account
If you don't already have an account, go ahead and go to [aws.amazon.com](https://aws.amazon.com) and sign up for an account.  This Lambda function doesn't do much so it will most likely stay in the free tier.

## Setting Up Your Discord Server
Once you have a Discord account, setting up your own server is amazingly simple, and can be done in about two minutes.

In the desktop version of Discord:

1. Click the green icon with the plus to create a server.  
![add a server](assets/discord-add-a-server.png)

2. Choose **Create My Own**, then **For Me and My Friends**.
3. Give the new server a name.  Icon is optional.

Now that you have a server, let's set up a webhook for it.

1. Click the plus sign next to "Text Channels" and create a new text channel called "**project-notifications**"


2. Click the gear icon next to project-notifications in the list at the left.  
![Opening Channel settings](assets/discord-edit-channel.png)
3. Click **Integrations** in the nav bar at the left. ![Discord's Integrations Tab](assets/discord-integrations-tab.png)


4. Click **Create Webhook**.
5. Name it "**Status Changes**".
6. Click **Copy Webhook URL**.
7. Paste the URL somewhere where you can copy it later. (If you lose it, you can still get it from Discord.)
7. Click Save Changes.

That URL is the webhook; properly-formatted messages ("requests") to that URL will add a message into the project-notifications channel. Now that you have the magic URL, let's take it to AWS.

## Writing Your Lambda Function

Back in AWS, log into the console.  This will present you with a dizzying list of services.  For this section, the service we're interested in is Lambda.  Find it on the page and open it.

Make a note of the Region you're "in".  In this example, this account is working in the AWS region "N. California (us-west-1)". A notion peculiar to AWS is that your services and functions are associated with a particular region, so if you're not in the right region (or referencing it) you will be wondering why your function is missing.

1. Click on the Functions section in the nav bar and select **Create function**
2. Click Author from Scratch.
3. Give your function a name.  In this example we'll call it `discord-wh-relay`.
4. Leave everything else at the defaults and select **Create function**.  For this example, we'll be writing in JavaScript, so Node.js is appropriate.
5. The view that appears should have a **Code source** section.  A folder labeled **discord-wh-relay will be selected, with an `index.js` file just underneath.
6. Double-click `index.js`.  This will reveal a little code template for the *handler* that will handle the incoming webhook from SyncSketch.
7. Delete the `// TODO implement` line 
8. Where that line was, let's put in the Discord webhook URL and assign it to a variable:

`var path ="`*paste-your-discord-webhook-url-between-the-quotes*`";`

Next, we'll add a dummy message for now, right where the line you just deleted was:

`const message = 'Jerome Newton changed the approval status of "GroomFaintsWIP_5.mp4" in the "Wedding Scene" review from **In Progress** to **Approved**';`

Add these lines before the first line:

```
const https = require('https');
const url = require('url');
```
The code for index.js should now look like this:

```
const https = require('https');
const url = require('url');

function handler(event, ctx, cb) {
    const path = "https://discord.com/api/webhooks/825812896431996938/og_Gr7e84y54iuFPU24Coqwgxsw7On1SmQbCFYB__GC9Pj-Q4UlZqBBpmb88MIB19iHf";
    const message = JSON.stringify(`Jerome Newton changed the approval status of **GroomFaintsWIP_5.mp4** in the **Wedding Scene** review from **In Progress** to **Approved**`);  

}
exports.handler = handler;

```

Next, we'll add the line that triggers the webhook message to be sent. This will replace the lines between where the `message` is defined and before that last curly brace (`}`):

```
        webhook(message, path)
        .then((result) => {
            cb(null, JSON.stringify(result));
        })
        .catch(error => cb(error));
```
## Adding the Webhook Sender

Finally, we'll add the `webhook()` function that we are using to send the webhook message to Discord.  You don't need to know much about this code, except that it creates and sends its own webhook request, formatting the message that we give it into the appropriate format for Discord.  Just paste it in after the last line of `index.js`:

```
function webhook(message, wh) {
    return new Promise((resolve, reject) => {
        const whurl = url.parse(wh);
        const payload = JSON.stringify({
            'username': 'SyncSketch',
            'content':  message
        });
        const options = {
            hostname: 'discordapp.com',
            headers: {'Content-type': 'application/json'},
            method: "POST",
            path: whurl.path, 
        };
        var bufferData = '';
        const req = https.request(options, (res) => {
            res.on("data", (data) => {
                bufferData += data;
            });
            res.on("end",  () => {
                let data = {message: 'Webhook message sent!'};
                if(bufferData.length) {
                    data = JSON.parse(bufferData);
                }
                if(data.code) {
                    reject(JSON.stringify({statusCode:data.code, body:data.message}));
                } else {
                    resolve({statusCode: 200, body: data.message});
                }
            });
        });

        req.on("error", (error) => {
            reject(Error(error));
        });
        req.write(payload);
        req.end();
    });
}
```

Let's test it to see how we're doing so far.  This should be enough code to do something gratifying.  

## Creating a Test Event
Lambda functions respond to *events*.  The events we are concerned with will be approval status changes in SyncSketch.  Now we are going to create a test event that will eventually simulate a message coming from SyncSketch.  

Just above the code window is a Test button that will trigger an event.  Click the triangle next to it and choose **Configure Test Event**.

![Configure Test Event Popup](./assets/lambda-configure-test-event.png)

In the dialog that appears, a test event template called `hello-world` will appear, which is suitable place to start.  Rename it "**approvalStatusChange**" and for now we'll leave everything else the way it is:

![Configure Test Event Dialog](./assets/lambda-configure-test-event-dialog.png)

Click **Create** at the bottom of the dialog.

If you click **Test** now, the code tab will be replaced with a console tab that displays unformatted text.  No message appears in Discord, and the console shows this raw response data:

```
{
  "statusCode": 200,
  "body": "\"Hello from Lambda!\""
}
```

Wait, where is that coming from?  What's going on?  The answer is that you need to *deploy* the new code before you test it.  Think of it like a Save button, or more aptly the Publish button in a blogging app.  Every time you change the code in here, you need to deploy it, so let's do that.  

Click the big orange **Deploy** button.

*Now* you can click **Test**.  If all is well, you should hear a "bloop" and your test message should appear in Discord!

### Troubleshooting
Computers were made to disappoint. Writing code is no exception.  Here are some troubleshooting tips if you're not seeing the Discord message when you click Test.

### Nothing posts to Discord
If everything seems OK and you're getting a status code of 200 back but nothing is appearing in Discord, the problem is surely in the webhook URL in the `path` variable.  Go back into Discord and open the settings gear next to your server's "project-notifications" channel. Click **Integrations**, then **View Webhooks**. Select your "Status Changes" webhook and click **Copy Webhook URL**.  Paste it between the double-quotes after `path=`.

### Getting errors that suggest a problem with my code
If you're getting JavaScript errors, rebuild your JavaScript as follows:

Delete all of the code from `index.js`. Copy these first lines and paste them in:

	const https = require('https');
	const url = require('url');
	
	function handler(event, ctx, cb) {
	    const path = "https://discord.com/api/webhooks/825812896431996938/og_Gr7e84y54iuFPU24Coqwgxsw7On1SmQbCFYB__GC9Pj-Q4UlZqBBpmb88MIB19iHf";
	    const message = JSON.stringify(`Jerome Newton changed the approval status of **GroomFaintsWIP_5.mp4** in the **Wedding Scene** review from **In Progress** to **Approved**`);  
	    webhook(message, path)
	    .then((result) => {
	        cb(null, JSON.stringify(result));
	    })
	    .catch(error => cb(error));
	}
	exports.handler = handler;

3. Then after those lines, append the lines from the "Add the Webhook Sender" section above.
4. Finally, replace the Discord webhook URL in the example with your own, according to the procedure described in the "Nothing posts to Discord" solution above. 

## Creating the API Gateway

Message traffic coming into a Lambda function like this one generally must come through an *API Gateway*, so let's add one.

Scroll to the top of your function's page.
> SCREENIE

Click the **Add Trigger** button. 

![Add Trigger](./assets/lambda-add-trigger.png)

From the popup in the following dialog, select **API Gateway**.

![Add Trigger](./assets/lambda-add-gateway.png)

For the trigger configuration we will create an *open REST API*:

![Gateway Config Dialog](./assets/lambda-gateway-config.png)

1. Leave **Create an API** selected.
2. Choose the **REST API** box
3. Under **Security**, select **Open**
4. Click **Add**

By default the name will be `discord-wh-relay-API`.  Click it to configure it.

### Testing from the Gateway

1. Click Test.  The following big dialog will appear.

![Gateway Config Dialog](./assets/lambda-gateway-config.png)


2. Set the Method to POST.
3. 


The dummy message should show up in your Discord server like so:

> SCREENIE

If so, so far so good!  If not, check the following:

* The URL for your Discord webhook is in quotes in the `path` specified in `index.js`
* You deployed your changes in the function
* Your dummy message has the correct syntax.  Pay attention to the use of single quotes and double quotes in the example
* ...

For Discord, this bit here is the magic:

```
        const payload = JSON.stringify({
            'username': project + ' on SyncSketch',
            'content':  message
        });
```
Discord wants a JSON object in the body containing  `username` and `content` text strings and that's it.  Everything else you see here is about building a webhook message of our own and doing some error-checking, then sending it and relaying Discord's response back to `index.js`.

## Writing your Webhook Listener

Now we'll get the Lambda function to handle real input.

As input, the SyncSketch webhook will send JSON in the body of the message that looks something like this, which is what is sent with the `item_approval_status_changed` event:

```
{
  "account": {
    "name": "Discord-Relay Test Workspace",
    "id": 100
  },
  "item_name": "image.jpeg",
  "review": {
    "name": "Review Name",
    "id": 123
  },
  "item_creator": {
    "id": 1,
    "name": "Mike Jennings",
    "email": "tymcode@gmail.com"
  },
  "new_status": "approved",
  "project": {
    "name": "The Bridegoon Project",
    "id": 101
  },
  "item_id": 4056789,
  "old_status": "wip"
}
```

We will pull the values from this data structure to build the message that gets posted to the chat.

> DOCUMENT REPLACING THE DUMMY MESSAGE WITH A TEMPLATE STRING

To test this, we will need to send a message that has a body. Copy the example body above and replace the body data in the WebHookTrigger test event.

> DOCUMENT UPDATING THE TEST EVENT

Now test it again, and verify that the body data is being formatted correctly in the Discord chat.

> SPEND SOME TIME WITH TROUBLESHOOTING TIPS HERE

## Adding the API Gateway

For messages from SyncSketch to get routed to your Lambda, they must go through a gateway.  So now it's time to add an API Gateway to your Lambda.

> DOCUMENT CONFIGURING THE API GATEWAY

We can test it within the API Gateway console.

> DOCUMENT THE BUILT IN TEST

If this succeeds then it should be accessible from the outside world.  Let's have a look.

> CURL STATEMENT

You should have a new message in the chat, which means your function is complete and working! Now all we have to do is set up the SyncSketch webhook to send messages to it.

## Creating a SyncSketch Webhook

Before we start setting up the webhook in your SyncSketch account, you need the following bits of information:

* The http address of your API Gateway's POST method
* Which events you want to be notified about from the available list

Currently there's no way to set up the webhooks in the SyncSketch web site.  But we can still do it with cURL or Postman.  In fact, the SyncSketch API page will provide the cURL command to set up the webhook, and we will use that as a template to make ours.

> DOCUMENT DOING IT WITH CURL

If you don't care to use a command-line tool like cURL, there are many application programs like Postman and Insomnia that will help you build your API request graphically.

To use Postman:
1. Copy the cURL command from the Create a Webhook API documentation
2. Select File > Import
3. In the import dialog, select the "Raw text" tab.
4. Paste in the cURL command into the dialog and hit OK

Nw you can replace the default text with your sspecific details, like the URL for the API Gateway

If you send your request and receive a response code of 200, you should be ready to go.  In your SyncSketch account, trigger the event that you want notifications about, and give it a try!

> TROUBLESHOOTING

## Other Events

Each event notification will have a different JSON data structure in its body.  If you require more than one notification type, you will need to determine the event type before you build the Discord message.  For this reason, we will add a little more complexity to `index.js` so that it supports multiple event types.

> WRAP THE MESSAGE BUILDER IN A SWITCH STATEMENT.   MORE MODULES?

## Other Listeners

You may prefer to receive notifications using other listeners, like Slack or SMS text message.  Here's how you might adapt the code we've made for other uses.

> SHOW AWS SNS USAGE

## Sending Custom Request Headers

You may wish to send data specific to your account along with each webhook message, such as an authentication token.  SyncSketch does not currently allow you to specify anything to be added to the body of the messages, but it does let you add custom HTTP headers in the request. Normally, Lambda only provides your handler function with body content from the message, so we will need to configure it to pass along the headers as well.

Currently we have our Discord webhook URL hard-coded in our Lambda.  This is good for security, but not so good for versatility. To illustrate the configuration details we're going to update our example listener to accept Discord webhook URLs as a custom header, in order to allow you to use this one Lambda function for any Discord server channel.

