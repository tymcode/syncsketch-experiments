/************************************
 * 
 *  SkyncSketch Javascript API module
 *  v1.1
 *  4/2021 
 *  @author Mike Jennings
 *  
 *  @fileOverview A vanilla JS interface to the SyncSketch.com REST API
 * 
 *  Note: Most query results are returned in a dictionary format:
 {
    "meta": {
        "limit": , // how many search results to return at a time
        "next": , // path to the next page of <limit> search results, null if all results shown
        "offset": , // starting index from the current page of search results
        "previous": null, // path to the previous page of <limit> search results, null if all results shown
        "total_count": 1 // Length of the objects array (# of search results)
    },
    "objects": [
        {
            "active", // if `false`, has been deleted but not yet purged from the system
            "created", // creation date
            "id", // an integer ID for that item, unique to the item type
            "modified", //last modification date
        } 
    ]
}

 *************************************/



/**
 * Private function for executing XMLHTTPRequests
 * @private
 * 
 * @param {String} entity The endpoint for the resource type (project | review | item | reviion | annotation etc.)
 * @param {callback} callback 
 * @param {String|Object} query String for HTTP GET query strings, not URIEncoded
 * @param {String} type HTTP request type (GET | POST | PATCH)
 */
 function getJSONResponse( entity, callback, query, type = 'GET' ) {
    
    if( typeof( entity ) == 'object' ) { // override URL construction for non-API URLs
        var url = entity.url; 
        contentType = entity.contentType;
    } else {
        var url = this.baseURL + entity; 
        contentType = 'application/json';
    }

    if(url.slice(-1) != '/') url += '/'; // shouldn't need this, but just in case
    var xhr = new XMLHttpRequest();
    
    if(type != 'GET') {
        xhr.open(type, url, true);
    } else {
        // append other params (if type = POST then query is used for body)
        url += query ? '?' + serialize(query) : ''; 
        console.log(`Request: ${url}`)
        xhr.open('GET', url, true);
    }

    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('Authorization', this.authKey);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function() {
        if( xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 201) ) {
            console.log(`Response: ${JSON.stringify(JSON.parse(xhr.responseText), null, '\t')}`)
            callback(JSON.parse(xhr.responseText));
        } else {
            if( xhr.status != 200 && xhr.status != 201 ) {
                console.log(`The server responded with an HTTP ${xhr.status}.`)
                console.log(`Response: ${xhr.responseText}, Status ${xhr.status}, State: ${xhr.readyState}`);
                callback({err: xhr.status});
            }
        }
    }

    if(type == 'POST' || type == 'PATCH') {
        var postData = JSON.stringify(query); // overload query for post data
        if(postData == undefined) debugger;
        xhr.send(postData);
        var datastring = `Post Data: ${JSON.stringify(query, null, '\t')}`
        console.log(datastring)
    } else {
        xhr.send();
    }
}

var serialize = function( obj ) {
    // private function for serializing JSON strings for queries, etc.
    var str = [];
    for ( var p in obj )
      if ( obj.hasOwnProperty(p) ) {
        str.push( encodeURIComponent( p ) + "=" + encodeURIComponent( obj[ p ] ) );
      }
    return str.join( "&" );
  }

function handleResult( res) {
    if (res.err) {
        reject(res.err)
    }
    resolve(res);
}
  class SyncSketchAPI {
   /**
    * @class Represents the SyncSketch API.
    * 
    * Almost all of these API calls return JSON. The resulting JSON object will be returned to your 
    * callback function.
    * 
    * 
    * <caption>Anonymous callback function in the call</caption>
    * 
    * ```
    * const ss = new SyncSketchAPI('john@doe.com', '9e43131a74484de9cb14e3255760cec68d0d8898');
    * ss.getReviewById( reviewData => {
    *  if( reviewData.name !== undefined ) {
    *      $('#review-name').replaceWith('<h2 id = "review-name"> + reviewData.name + '</h2>')
    *  } else {
    *      console.log( `Unable to get the review data. Response was ${ JSON.stringify( res ) }` ); 
    *  }
    * }, reviewId);
    * ```
    * 
    * <caption>Callback -> Promise</caption>
    * 
    * ```
    * const ss = new SyncSketchAPI('john@doe.com', '9e43131a74484de9cb14e3255760cec68d0d8898');
    * function getReviewData( reviewId ) {
    *    return new Promise( ( resolve, reject ) => {
    *       ss.getReviewById( res => {
    *          if( res.id !== undefined ) {
    *             resolve( res.id, reviewId );
    *          } else {
    *             reject( res, reviewId );
    *          }
    *       }, reviewId )
    *    })
    * }
    * 
    * getReviewData( theReviewId )
    * .then( res => {
    *    // Response was successful, pass the review data on as a new Promise
    *    return res;
    *  })
    *  .catch( res => {
    *	   console.log( `Unable to get the review data. Response was ${ JSON.stringify( res ) }` );
    * })
    * .then( reviewData => {
    *    $('#review-name').replaceWith('<h2 id = "review-name"> + reviewData.name + '</h2>')
    *  })
    * ```
    * 
    * @param {String} email Your SyncSketch username
    * @param {String} api_key The API Key from the SyncSketch Accounts page Settings view
    * @param {String} host 
    * @param {Boolean} useExpiringToken 
    * @param {Boolean} debug Causes extra console logs if `true`
    * @param {String} apiVersion 
    */
    
    constructor ( email, api_key, host = 'https://syncsketch.com', useExpiringToken = false, debug = false, apiVersion = 'v1' ) {
        this.authKey = `apikey ${email}:${api_key}`;
        this.debug = debug;
        this.HOST = host;
        this.baseURL = this.HOST + '/api/';
    }
    
    reviews(options, done = null) {
        console.log(JSON.stringify(options, null, '\t') + ": " +  typeof options)
        var simpleQuery = {};
        var p = new Promise((resolve, reject) => {
            if ( options !== undefined ) {
                    switch (typeof options) {
                        case "boolean":
                            simpleQuery.active = options;
                            break;
                        case "string":
                            simpleQuery.name = options;
                            break;
                        case "number":
                            if (isFinite(options)) { // make sure it's not NaN
                                // If low number it's probably a limit, else a reviewId (or projectId, but not as likely)
                                let prop = (options < 500 ? "limit" : "reviewId")
                                simpleQuery[prop] = options;
                            }
                            break;
                        case "object":
                            // not specific enough in Javascript
                            switch (options.constructor) {
                                case Array:
                                    // An array of reviewIDs, should return an array of Reviews
                                    break;
                                case Date:
                                    // would need a getReviewByDate() function
                                    break;
                                case Object:
                                    // already an object; stash it
                                    simpleQuery = options;
                                    break;
                                default:
                                    reject({ err: "Unknown argument type" }, p)
                                    break;
                            } // switch/object
                        default:
                            break;
                    } // switch
                    options = simpleQuery; // normalize back to Object
                    
                    if (options.projectId) {
                        options.project__id = options.projectId;
                        delete options.projectId;
                    } 
                    if (options.name) {
                        options.name__istartswith = options.name;
                        delete options.name;
                    } else {
                        //get all reviews, with any options
                    }
                } else options = { active: true };
                getJSONResponse.call( this, `review/${options.reviewId ? options.reviewId + '/' : ''}`, res => { res.err ? reject( res.err ) : resolve( res ) }, options );
            });
            if ( done ) {
                p.then( res => done( null, res ), err => done( err ) );
            } else {
                return p;
            }
        } // reviews function
    
    /** Get nested tree of Account, Projects, Reviews and (optionally) items for the current user 
     * @param {callback} callback
     * @param {Boolean} withItems If `true`, include media items in Reviews
     * @return {Object}
     */
    getTree( callback, withItems = false ) {
        // PRIVATE_API
        getJSONResponse.call( this, `v1/person/tree/`, function(res) {callback(res)}, (withItems ? { 'fetchItems':  1 } : null) );
    }

    getAPIBaseURL() {
        // TODO: Implement.  Several endpoints require different version numbers so 
        // the version is with the function for now
        return 'https://syncsketch.com/api/';
    }

    /**
     * Returns Accounts associated with the username specified in the constructor's 
     * params.
     * 
     * @param {callback} callback
     * @param {Boolean} [active=undefined] If `true`, only show active Accounts, if `false` only show 
     * deactivated (deleted, but not yet purged) Accounts. If `undefined`, show all.
     * @returns {Object} A dictionary with search results 
     */
    getAccounts( callback, active = 1, fields ) {
        let query = (active ? { 'active':  1 } : {'active': 0 } );
        if(fields !== undefined) query.fields = fields;
        getJSONResponse.call( this, `v2/account/`, res => { callback( res ) }, query );
    }
    
    updateAccount(accountId, data) {
        // TODO: Implement
    }

    /**
     * Returns an object containing a list of all Projects in the current Account
     * 
     * @param {callback} callback
     * @param {Boolean} [active=undefined] If `true`, only show active Projects, if `false` only show 
     * deactivated (deleted, but not yet purged) Projects. If `undefined`, show all.
     */
    getProjects( callback, includeDeleted = false, includeArchived = false, limit = 10, offset = 0, fields ) {
        // TODO: add documentation
        let query ={
            active: ( includeDeleted ? 0 : 1),
            is_archived: ( includeArchived ? 1 : 0),
            account__active: 1,
            limit: limit,
            offset: offset
        };
        if(fields !== undefined) query.fields = fields;
        getJSONResponse.call( this, `v1/project/`, res => { callback( res ) }, query );
    }
    
    /**
     * Returns an object containing a collection of all Projects that start with `name`
     * 
     * @param {callback} callback
     * @param {String} name Name of Project, or prefix of Project names
     * @returns {Object} A collection of all Projects that start with `name`
     */
     getProjectsByName( callback, name ) {
        // PRIVATE_API
        getJSONResponse.call( this, `v1/project/`, res => { callback( res ) }, (name !== undefined ? {name:name}: null) );
    }
    
    /**
     * Returns an object containing data for the specified Project
     * 
     * @param {callback} callback
     * @param {Number} projectId The `id` property of the desired Project
     * @returns {Object} Dictionary containing data for one specified Project
     */
    getProjectById( callback, projectId, fields ) {
        getJSONResponse.call( this, `v1/project/${projectId}/`, res => { callback( res ) }, (fields !== undefined ? {fields: fields} : null ));
    }
    
    updateProject( projectId, data ) {
        // TODO: Implement
        // return self._get_json_response("project/%s" % project_id, patchData=data)
    };
    
    deleteProject( projectId, data ) {
        // TODO: Implement
        //return self._get_json_response("project/%s" % project_id, patchData=dict(active=0))
    };
    
    duplicateProject( projectId, name = undefined, copyReviews = false, copyUsers = false, copySettings = false ) {
        // TODO: Implement
        //(`v2/project/${projectId}/duplicate/` % project_id, api_version="v2", postData=config)
    };

    archiveProject( projectId ) {
        // TODO: Implement
        //self._get_json_response("project/%s" % project_id, patchData=dict(is_archived=1))
    };

    restoreProject( projectId, ) {
        // TODO: Implement
        //return self._get_json_response("project/%s" % project_id, patchData=dict(is_archived=0))
    };

    /**
     * Returns an object containing data for all Reviews in the specified Project.
     * 
     * @param {callback} callback
     * @param {Number} projectId The `id` property of the desired Project
     * @param {String} [fields] comma-separated list of properties to return. (No spaces.) If unspecified, returns all properties.
     * @returns {Object} Object containing data for all Reviews in the specified Project
     */
    getReviewsByProjectId( callback, projectId, active = 1, fields ) {
        // TODO: implement all params: "project__id": project_id, "project__active": 1, "project__is_archived": 0, "limit": limit, "offset": offset
        let query = { 
            'project__id': projectId,
            active: (active == false ? 0 : 1)
        };
        if( fields !== undefined ) query.fields = fields;
        getJSONResponse.call( this, `v1/review/`, res => { callback( res ) }, query );
    }
    
    /**
    * Returns an object containing a list of all Reviews that start with <name>
    * 
    * @param {callback} callback
    * @param {String} name Name of Reviews, or prefix of Review names
    * @param {String} [fields] comma-separated list of properties to return. (No spaces.) If unspecified, returns all properties.
    * @returns {Object} Dictionary containing data for all Reviews starting with the specified name
    */     
     getReviewByName( callback, name, fields ) {
        let query = { 
            'name__istartswith' : name 
        }; 
        if( fields !== undefined ) query.fields = fields;
        getJSONResponse.call( this, 'v1/review/', res => { callback( res ) }, query ); 
    }
    
    /**
     * Returns an object containing data for the specified Review.
     * 
     * @param {callback} callback
     * @param {Number} reviewId The `id` property of the desired Review
     * @returns {Object} Object containing data for specified Review.
     */
     getReviewById( callback, reviewId ) {
        getJSONResponse.call( this, `v1/review/${reviewId}/`, res => { callback( res ) } );
    }

    updateReview( callback, reviewId, data ) {
        // TODO: Implement.  Well, test.  It might just work
        getJSONResponse.call( this, `v1/review/${reviewId}/`, res => { callback( res ) }, data, 'PATCH' );
    }
 
    deleteReview( callback, reviewId ) {
        // TODO: Document
        let query = {active:0};
        getJSONResponse.call( this, `v1/review/${reviewId}/`, res => { callback( res ) }, query, 'PATCH' );
    }   

    /**
     * Returns an array of Revisions. If `itemId` is present, will return Revisions 
     * associated with that media item.
     * 
     * @param {callback} callback
     * @param {Number} itemId `id` property of media item
     * @param {Number} [limit] Limit returned results.  If unspecified, limits to 10.
     * @returns {Object} Dictionary containing list of Revisions in the Account. If 
     * `itemId` is specified, returns a dictionary with a collection of Revisions associated 
     * with the specified media item.
     */
    getRevision( callback, itemId, limit = 10 ) {

        let query = {
            limit: limit,
            'item__id': itemId
        };
        getJSONResponse.call( this, 'v1/revision/' , res => { callback( res ) }, query );
    }
    
    /**
     * This is a general search function. You can search media items by:
     * 
     * ```
     * 'id'
     * 'name'
     * 'status'
     * 'active'
     * 'creator': ALL_WITH_RELATIONS, <-- these are foreign key queries
     * 'reviews': ALL_WITH_RELATIONS, <-- these are foreign key queries
     * 'created' using 'exact', 'range', 'gt', 'gte', 'lt', 'lte'
     * ```
     * 
     * Specify the resource type and its properties using Django-style double-underscore syntax. 
     * If you want to query by "review name," for example, you would pass in
     * <p/>
     * `reviews__name = NAME TO SEARCH`
     * <p/>
     * Using the "`__`" syntax you can even search for items relationally, like
     * <p/>
     * `reviews__project__name = $PROJECT NAME TO SEARCH`
     * <p/>
     * To speed up a query you can also pass in a limit e.g `limit:10`; the `meta` object in 
     * the returned object will provide paths for getting the next (or previous) "page" of results.
     * <p/>
     * NOTE: Please make sure to include the `active:1` query if you only want active media. Deleted files are 
     * currently only deactivated and kept for a certain period of time before they are "purged" from the system.
     * 
     * ```
     * results = ss.getMedia(res => gotReview(res), {'reviews__project__name':'My Project', 'limit': 1, 'active': 1})
     * // Returns a dictionary with the first active Review within the "My Project" Project and sends it to gotReview()
     * ```
     * 
     * @see {@link https://docs.djangoproject.com/en/1.11/topics/db/queries/|Django search definition} to query
     * items by foreign keys using Django syntax.
     * 
     * @param {callback} callback
     * @param {object} searchCriteria 
     * @returns {Object} Object
     */
     getMedia( query, callback ) {
       
        getJSONResponse.call( this, 'v1/item/', res => { callback( res ) }, query  );
    }
    
    /**
     * Returns a set of media items associated with the specified Review.
     * 
     * @param {callback} callback
     * @param {Number} reviewId `id` property of the desired Review
     * @param {Boolean} [active] If `true`, only show active Projects, if `false` only show 
     * deactivated (deleted, but not yet purged) Projects. If `undefined`, show all.
     * @returns {Object} A collection of media item records associated with the specified Review
     */
    getMediaByReviewId( callback, reviewId, active = 1 ) {
        let query = { 
            'reviews__id' : reviewId 
        }; 
        query.active = (active == false ? 0 : 1);
        getJSONResponse.call( this, 'v1/item/', res => { callback( res ) }, query  );
    }
    
    /**
     * Get sketches and comments for an item. Frames have a revision ID which signifies a "set of notes".
     * When querying an item you'll get the available revisions for this item. If you wish to get only the latest
     * revision, please get the `revisionId` for the latest Revision.
     * 
     * @see [getRevision()]{@link SyncSketchApi#getRevision}
     * 
     * @param {callback} callback
     * @param {Number} itemId `id` of the media item you are querying.
     * @param {Number} [limit] Limit search results (optional, but recommended)
     * @param {Number} [offset] For paging of limited search results
     * @param {Number} [revisionId] Optional `revisionId` to narrow down the results
     * @param {Object} [params] search params, including `creator` (ID) and date range: `created__gt` (e.g. 2021-01-01) and `created__lt`
     * @param {String} [type] "comment" or "sketch" to return just one or the other. If unspecified, returns both.
     * @returns {Object} Object
     */
     getAnnotations( callback, itemId, limit = 30, revisionId = 0, params = {}, type = '' ) {
        // TODO: Test offset
        let query = (params !== undefined ? params : {} );
        if(revisionId) query.revisionId = revisionId;
        if(type.indexOf('comment') !== undefined || type.indexOf('sketch') !== undefined ) query.type = type;
        query.item__id = itemId;
        getJSONResponse.call( this, 'v1/frame/', res => {
            callback( res ), query;
        } );
    }

    /**
    * Returns an object containing a list of users in this account starting with `name`.
    * 
    * @param {callback} callback
    * @param {String} name Starting characters in the name of user(s)
    * @returns {Object} Dictionary containing users matching `name`
    */   
    getUsersByName( callback, name ) {
        let query = {
            'name__istartswith': name
        };
        getJSONResponse.call( this, 'v1/simpleperson/', res => {
            callback( res );
        }, query);
    }
    
    /**
     * Returns an object containing a list of users for this Project.
     * 
     * @param {callback} callback
     * @param {Number} projectId `id` property of desired Project
     * @returns {Object} Dictionary containing users in the specified Project
     */   
    getUsersByProjectId( callback, projectId ) {
        let query = {
            'projects__id': projectId
        };
        getJSONResponse.call( this, 'v1/simpleperson/', res => {
            callback( res ), query;
        } );
    }
    
    /**
     * Returns an object containing the specified User's data.
     * 
     * @param {callback} callback
     * @param {Number} userId `id` property of desired User
     * @returns {Object} Dictionary containing User's data
     */
    getUserById( callback, userId ) {

        getJSONResponse.call( this, `v1/simpleperson/${userId}/`, res => {
            callback( res );
        });
    }
    
    /**
     * Returns an object containing the current User's data
     * 
     * @param {callback} callback
     * @returns {Object} Dictionary containing User's data
     */  
    getCurrentUser( callback ) {

        getJSONResponse.call( this, 'v1/simpleperson/currentUser/', res => {
            callback( res );
        });
    }
    
    /** 
    * Add a Project to your account. Please make sure to pass the accountId which you can query using the getAccounts command.
    * HTTP 403 errors indicate either an authorization problem with your username and API Key, or that your
    * plan has reached the maximum number of Projects allowed, and a Project must be deleted or your plan upgraded.
    *
    * @param {callback} callback
    * @param {Number} accountId id of the account to connect with
    * @param {String} name Name for the new Project
    * @param {String} [description] Description of the new Project
    * @param {Object} data Dictionary with additional information e.g. is_public. Find out more about available fields at /api/v1/project/schema/.
    * @returns {Object} data object for the new Project
    */
    addProject( callback, accountId, name, description = '', data = {} ) {

        if( accountId === undefined ) {
            callback({err: "AccountId is undefined"})
        }
       var projectData = {
           'name': name,
           'description': description,
           'account': `/api/v1/account/${accountId}/`,
        };
        var postData = Object.assign( data, projectData); 

        getJSONResponse.call( this, 'v1/project/', res => { callback( res ) }, postData, 'POST' );
    }

    /**
     * Add a new Review to the specified Project.
     * 
     * @param {callback} callback
     * @param {Number} projectId id of the Project the Review will be added to
     * @param {String} name Name for the new Review
     * @param {String} [description] Description of the new Review
     * @returns {Object} Data object for the new Review
     */
    addReview( callback, projectId, name, description = '', data = {} ) {

        if( projectId === undefined ) {
            callback({err: "projectId is undefined"})
        }
        var reviewData = {
            'name': name,
            'description': description,
            'project': `/api/${this.apiVersion}/project/${projectId}/`,
         };
         var postData = Object.assign( data, reviewData );
         getJSONResponse.call( this, `v1/review/`, res => {
            callback( res );
        }, postData, 'POST' );
    }

    /**
     * Convenience function to upload a file to a review. It will automatically create
     * an Item and attach it to the Review. 
     * 
     * @see [addItem()]{@link SyncSketchAPI#addItem} if you are hosting your own media and can pass in the `external_url` and 
     * `external_thumbnail_url`.
     * 
     * @todo Finish implementing this function
     *
     * @param {Number} reviewId `id` of the Review that will contain the media item
     * @param {String} filepath Path for the file on disk e.g `/tmp/movie.webm`
     * @param {Boolean} noConvertFlag If the video you are uploading is already in a browser-friendly format
     * @param {Number} itemParentId Set when you want to add a new version of an item. 
     * @returns {Object} Object with description of new Item.
    */
    addMedia( callback, reviewId, filepath, noConvertFlag = false, itemParentId = false ) {

        let query = JSON.parse(JSON.stringify(this.apiParams)); // deep copy

        if( noConvertFlag !== undefined ) query.noConvertFlag = 1;
        if( itemParentId !== undefined ) query.itemParentId = itemParentId;

        var uploadURL = `${this.HOST}/items/uploadToReview/${reviewId}/${serialize(query)}`
        if( this.debug ) console.log(`File URL: ${uploadURL}`);

        var files = {
            'reviewFile': null // TODO: finish this
        }
        var response = 'post' // TODO: finish this
        callback({err: "API not yet implemented"})
        //TODO: error check
    }

    /**
     * Give Project access to a group of Users.
     * Deprecated Method.
     * 
     * @param {callback} callback
     * @param {Object} projectId `id` property of the Project that the Users will be added to
     * @param {Object[]} users array of object literals 
     * @param {String} users.email
     * @param {String} users.permission such as `'viewer'`
     * @returns {Object} Key `'addedUsers'` containing an array of usernames for added users
     */
    addUsers( callback, projectId, users ) {
        console.warn(`Deprecated - please use method addUsersToProject instead`)
        if (!Array.isArray(users) ) {
            if( this.debug ) console.log(`Invalid data for users; must be array of objects with user properties`);
            callback({err: 'invalid user data format'})
        }
        if (projectId == undefined ) {
            if( this.debug ) console.log(`projectId is undefined.`);
            callback({err: 'projectId is undefined'})
        }

        let query = {
            users: JSON.stringify(users)
        };
        getJSONResponse.call( this, `v1/project/${projectId}/addUsers/`, res => {
            callback(res)
        }, query);
    }

    /**
     * Give Project access to a group of Users.
     * 
     * @param {callback} callback
     * @param {Object} projectId `id` property of the Project that the Users will be added to
     * @param {Object[]} users array of object literals with properties `email` and `permission`. Permission values are admin, member, restricted_member, reviewer, viewer
     * @param {String} note Text to be sent in an invitation email
     * @returns {Object} Key `'addedUsers'` containing an array of usernames for added users
     */
    addUsersToProject( callback, projectId, users, note='' ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please add users by list with user items e.g users=[{'email':'test@test.de','permission':'viewer'}]")
            callback(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        } 
        
        query = {
            "which": "project",
            "entity_id": projectId,
            "note": note,
            "users": users
        }
        getJSONResponse.call( this, `v2/add-users/`, res => {
            callback(res)
        }, query, 'POST');
    }
 
    /**
     * Remove Project access from a group of Users.
     * 
     * @param {callback} callback
     * @param {Object} projectId `id` property of the Project that the Users will be removed from
     * @param {Object[]} users array of object literals with properties `email` and `permission`. Permission values are admin, member, restricted member, reviewer, viewer
     * @returns {Object} Object
     */
   removeUsersFromProject( callback, projectId, users ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please remove users by list with user items e.g users=[{'email':'test@test.de'}]")
            callback(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        } 
        
        query = {
            "which": "project",
            "entity_id": projectId,
            "users": users
        }
        getJSONResponse.call( this, `v2/add-users/`, res => {
            callback(res)
        }, query, 'POST');
    }

    /**
     * Give Workspace access to a group of Users.
     * 
     * @param {callback} callback
     * @param {Object} accountId `id` property of the account that the Users will be added to
     * @param {Object[]} users array of object literals with properties `email` and `permission`. Permission values are admin, member, restricted_member, reviewer, viewer
     * @param {String} note Text to be sent in an invitation email
     * @returns {Object} Key `'addedUsers'` containing an array of usernames for added users
     */
    addUsersToWorkspace( callback, accountId, users, note='' ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please add users by list with user items e.g users=[{'email':'test@test.de','permission':'viewer'}]")
            callback(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        } 
        
        query = {
            "which": "account",
            "entity_id": accountId,
            "users": users
        }
        getJSONResponse.call( this, `v2/add-users/`, res => {
            callback(res)
        }, query, 'POST');
    }
 
    /**
     * Remove Workspace access from a group of Users.
     * 
     * @param {callback} callback
     * @param {Object} accountId `id` property of the account that the Users will be removed from
     * @param {Object[]} users array of object literals with properties `email` or `id` (the user's `creator_id`)
     * @returns {Object} Object
     */
   removeUsersFromWorkspace( callback, accountId, users ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please remove users by list with user items e.g users=[{'email':'test@test.de'}]")
            callback(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        } 
        
        query = {
            "which": "account",
            "entity_id": accountId,
            "users": JSON.stringify(users)
        }
        getJSONResponse.call( this, `v2/add-users/`, res => {
            callback(res)
        }, query, 'POST');
    }

    /**
     * Create a media item record and connect it to a review. This should be used when adding 
     * items with externally hosted media by passing in the `external_url` and `external_thumbnail_url` 
     * to the `additionalData` object.
     * 
     * <caption>Example `additionalData` object</caption>:
     * 
     * ```
     * additionalData = {
     *     external_url: http://52.24.98.51/wp-content/uploads/2017/03/rain.jpg
     *     external_thumbnail_url: http://52.24.98.51/wp-content/uploads/2017/03/rain.jpg
     * }
     *```
     * @see {@link https://www.syncsketch.com/api/v1/item/schema/} for a complete list of available fields to set.
     * 
     * @see [addMedia()]{@link SyncSketchAPI#addMedia} for uploading local files.
     * 
     * @param {callback} callback
     * @param {Number} reviewId `id` property of the Review that the media item will be added to
     * @param {string} name the name of the item as it will appear in the Review
     * @param {Number} fps The frames per second is very important for SyncSketch. It accepts floating 
     * point values (e.g. 29.97 or 23.976) but they will be rounded for display.
     * @param {Object} additionalData Dictionary with item info
     * 
     * ```
     * additionalData = {
     *      width: 1280,
     *      height: 720,
     *      duration (in seconds): 3 ,
     *      description: the description here,
     *      size: size (in bytes),
     *      type: image | video | whiteboard
     *  }
     * ```
     * 
     * @returns {Object} Item dictionary
     */ 
    addItem( callback, reviewId, name, fps, additionalData ) {
        
        var postData = {
            "reviews": [`/api/${this.apiVersion}/review/${reviewId}/`],
            "status": "done",
            "fps": fps,
            "name": name,
        }

        Object.assign(postData, additionalData);

        getJSONResponse.call( this, 'v1/item/', res => {
            callback(res)
        }, postData, 'POST');
    }

    /**
    * This allows a media item's dictionary entries to be updated.
    * 
    * @param {callback} callback
    * @param {Number} itemId `id` property of the media item you want to update
    * @param {Object} data Item dictionary with updated media item values
    * @returns {Object} Item dictionary with updated media item references array
    */
    updateItem( callback, itemId, data ) {

        if(typeof(data) != 'object') {
            console.log( "Invalid format for 'data'. Please pass an object literal.")
            callback({err: "Invalid Format"})
        }

        getJSONResponse.call( this, `v1/item/${itemId}/`, res => {
            callback(res);
        }, data, 'PATCH')
    }

    /**
     * Delete an Item by its `id`.
     * 
     * @param {callback} callback
     * @param {Object} itemId `id` property of item to be deleted
     * @returns {Object} Object
     */
    deleteItem( callback, itemId ) {
        getJSONResponse.call( this, `v1/item/${itemId}/`, res => {
            callback(res);
        }, {active:0}, 'PATCH')
    }
    
    /**
     * Delete a set of Items in an array of itemIds.
     * 
     * @param {callback} callback
     * @param {Object} itemList Array of `id` properties of items to be deleted
     * @returns {Object} Object
     */
    bulkDeleteItems( callback, itemList ) {
        getJSONResponse.call( this, `v2/bulk-delete-items/`, res => {
            callback(res);
        }, itemList, 'PATCH')
    }
    
    /**
     * Move an Item from one Review to another.  
     * 
     * @param {callback} callback
     * @param {Object} reviewId `id` property of target review
     * @param {Object[]} itemData Array of object literals with `id` and current `reviewId` properties of item to be moved
     * @returns {Boolean} <true> if successful, otherwise `false`
     */
    moveItems( callback, reviewId, itemData ) {
        var data = {
            "new_review_id": reviewId,
            "item_data": itemData
        }

        Object.assign(postData, additionalData);

        getJSONResponse.call( this, 'v2/move_review_items/', res => {
            callback(res)
        }, data, 'POST');
    }

    /**
     * Convenience function to check if the API is connected to SyncSketch.  
     * 
     * If the resulting HTTP status code is not 200 returns `false`, which most likely indicates
     * an authorization error.
     * 
     * @param {callback} callback
     * @returns {Boolean} <true> if successful, otherwise `false`
     */
    isConnected( callback ) {
         
        var url = `https://syncsketch.com/api/v1/person/connected/`
    
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', this.authKey);
        xhr.onreadystatechange = function() {
            if( this.debug ) console.log(xhr.status)
            switch (xhr.status) {
                case 200:
                    switch (xhr.readyState) {
                        case 1:
                            // OPENED
                            break;
                        case 2:
                            // HEADERS_RECEIVED
                            break;
                        case 3:
                            // LOADING
                            break;
                        case 4:
                            callback( { connection: true } );
                            break;
                        default:
                            console.log('Could not connect to SynchSketch API endpoint.  Probably an authorization error.');
                            console.log(`Response: ${xhr.responseText}, Status ${xhr.status}, State: ${xhr.readyState}`)
                            callback( { err: "UNKNOWN"} );
                            break;
                    }
                    break;
                case 403:
                    if(xhr.readyState == 4) {
                        console.log('Could not connect to SynchSketch API endpoint due to a 403 (forbidden) error.  Probably an authorization error.')
                        callback( { err: xhr.status } );
                    }
                    break;
                case 500: 
                    if(xhr.readyState == 4) {
                        console.log('The SyncSketch server is not handling your request properly, due to a 500 (internal server) error.')
                        callback( { err: xhr.status } );
                    }
                    break;
                    
                default:
                    console.log(`Could not send to SynchSketch API endpoint (${xhr.status}).  Probably an authorization error.`);
                    callback( { err: 'UNKNOWN' } );
                    break;
            }
        }
        xhr.send();
    }

    /**
     *          
     * Download overlay sketches for Maya Greasepencil. Function will download a zip file which contains
     * an XML and the sketches as png files. Maya can load the zip file to overlay the sketches over the 3D model!
     * 
     * @see {@link https://knowledge.autodesk.com/support/maya/learn-explore/caas/CloudHelp/cloudhelp/2018/ENU/Maya-Animation/files/GUID-8A571749-D3EB-4EE9-8CC9-9C42542C140A-htm.html|Maya - Grease Pencil Tool} 
     * for more information.
     * 
     * PLEASE make sure that /tmp is writable!
     * 
     * @param {callback} callback
     * @param {Number} reviewId
     * @param {Number} itemId
     * @returns {File} Zip file with XML and sketches as PNG files, for review inside Maya
     */
    getGreasePencilOverlays( callback, reviewId, itemId, homeDir = null ) {
        // TODO: Port from Python and implement with XHR
        let url = `${this.baseURL}v2/downloads/greasePencil/${reviewId}/${itemId}/`
        let r = requests.post(url, params=this.apiParams, headers = this.headers)
        celeryTaskId = r.json();

        // check the celery task
        let requestProcessing = true;
        checkCeleryUrl = `${this.baseURL}v2/downloads/greasePencil/${reviewId}/${itemId}/?`;
        r = requests.get(checkCeleryUrl, params=this.apiParams, headers = this.headers);

        while(requestProcessing) {
            result.r.json();

            // lots more goes here
        }

       getJSONResponse( { url: url, contentType: 'application/json' }, serialize(self.apiParams ), res => {
            if( res.err ) callback( err );
            getJSONResponse( { url: res['s3Path'], contentType: 'application/json' }, '', err => {
                callback( err );
            })
       })
    }

} // SyncSketchAPI
