
function getJSONResponse( entity, query, type = 'GET' ) {
    return new Promise( (resolve, reject) => {
        if( typeof( entity ) == Object ) { // override URL construction for non-API URLs
            var url = entity.url; 
            contentType = entity.contentType;
        } else {
            var url = this.baseURL + entity; 
            contentType = 'application/json';
        }

        if(url.slice(-1) != '/') url += '/'; // shouldn't need this, but just in case
        var xhr = new XMLHttpRequest();
        if(type != 'GET') {
            console.log(`URL is ${url}\nRequest type is ${type}\n${type} body is:\n${JSON.stringify(query, null, '\t')}`);
            xhr.open(type, url, true);
        } else {
            // append other params (if type != GET then query is used for body)
            url += query ? '?' + serialize(query) : ''; 
            console.log(`GET Request: ${url}`)
            xhr.open('GET', url, true);
        }

        xhr.setRequestHeader('Content-Type', contentType);
        xhr.setRequestHeader('Authorization', this.authKey);
        xhr.withCredentials = true;
        xhr.onreadystatechange = function() {
            if( xhr.readyState == 4 ) {
                let codeClass = xhr.status/100 << 0; // Group HTTP status code classes
                if(codeClass == 2 ) {
                    //console.log(`Response: ${JSON.stringify(JSON.parse(xhr.responseText), null, '\t')}`)
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    //console.log(`The request failed.`)
                    //console.log(`Response from the server: ${xhr.responseText}, Status ${xhr.status}, State: ${xhr.readyState}`);
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            }
        }

        if(type == 'POST' || type == 'PATCH') {
            var postData = JSON.stringify(query); // overload query for post data
            if(postData == undefined) debugger;
            xhr.send(postData);
        } else {
            xhr.send();
        }
    })
}

var serialize = function(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }

/**
* @class Represents the SyncSketch API.
* 
* Methods are asynchronous and should be called from async functions or using promises.
* @example
* ```
* async function updateReviewName( reviewId ) {
*     if(ss.isConnected()) {
*         try {
*             let reviewData = await ss.getReviewById( reviewId );
*              $('#review-name').replaceWith('<h2 id = "review-name"> + reviewData.name + '</h2>')
*         } catch ( err ) {
*              console.log( `Unable to get the review data. Response was ${ JSON.stringify( err ) }` ); 
*         }
*     }
* }
* 
* const ss = new SyncSketchAPI('john@doe.com', '9e43131a74484de9cb14e3255760cec68d0d8898');
* updateReviewName( 327680 );
* ```
* 
* Almost all of these API calls return JSON.
* 
* 
* @param {String} email Your SyncSketch username
* @param {String} api_key The API Key from the SyncSketch Accounts page Settings view
* @param {String} host 
* @param {Boolean} useExpiringToken 
* @param {Boolean} debug Causes extra console logs if `true`
* @param {String} apiVersion 
*/
class SyncSketchAPI {
    constructor ( email, api_key, host = 'https://syncsketch.com', useExpiringToken = false, debug = false) {
        this.authKey = `apikey ${email}:${api_key}`;
        this.debug = debug;
        this.HOST = host;
        this.baseURL = this.HOST + '/api/';
    }
   /**
    * Convenience function to check if the API is connected to SyncSketch.  
    * Checks for Status Code 200 and returns `false` if not, which most likely would be an authorization error.
    * 
    * @returns {Boolean|String}
    */
    isConnected() {
        return new Promise( (resolve, reject) => {
            var url = `${this.baseURL}v1/person/connected/`
            var result = false;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', this.authKey);

            xhr.onreadystatechange = function() {
                let codeClass = xhr.status/100 << 0; // Group HTTP status code classes
                if( codeClass == 2 && xhr.readyState == 4) {
                    result = true;
                    resolve( xhr.response ) ;
                } else {
                    if(xhr.readyState == 4) {
                        if( codeClass == 5) {
                            console.log('Could not connect to SynchSketch API endpoint due to a server error.')
                        } else {
                            console.log('Could not connect to SynchSketch API endpoint due to a client error.  Probably an authorization error.')
                        }
                        console.log(`Response: ${xhr.responseText}, Status ${xhr.status}, State: ${xhr.readyState}`)
                        reject ({
                            status: this.status,
                            statusText: xhr.statusText
                        });
                    }
                }
            }
            xhr.send()
        })
    }

    /* GET FUNCTIONS */

    getAPIBaseURL() {
        // TODO: Implement.  Several endpoints require different version numbers so 
        // the version is with the function for now
        return 'https://syncsketch.com/api/';
    }

    /** Get nested tree of Account, Projects, Reviews and (optionally) items for the current user 
     * @param {Boolean} withItems If `true`, include media items in Reviews
     * @return {Object}
     */
    async getTree( withItems = false ) {
        // PRIVATE_API get nested tree of account, projects, reviews and optionally items for the current user
        try {
            let result = await getJSONResponse.call( this, `v1/person/tree/`, (withItems ? { 'fetchItems':  1 } : null) );
            return result;
        } catch ( error ) {
            throw ( error );
        }
    }
    
    /**
     * Returns Accounts associated with the username specified in the constructor's 
     * params.
     * 
     * @param {Boolean} [active=undefined] If `true`, only show active Accounts, if `false` only show 
     * deactivated (deleted, but not yet purged) Accounts. If `undefined`, show all.
     * @returns {Object} A JSON object with search results 
     */
    async getAccounts( active = 1, fields ) {
        var query = { 'active': active ? 1  : 0 };
        if(fields !== undefined) query.fields = fields;
        try {
            let result = await getJSONResponse.call( this, `v2/account/`, query );
            return( result ); 
        } catch ( error ) {
            throw( error );
        }
    }
    
    async updateAccount( accountId, data ) {
        //TODO: Implement or at least test
        try {
            let result = await getJSONResponse.call( this, `v2/account/${accountId}/`, data, 'PATCH');
            return( result ); 
        } catch ( error ) {
            throw( error );
        }
    }

    /**
     * Returns an object containing a list of all Projects in the current Account
     * 
     * @param {Boolean} [active=undefined] If `true`, only show active Projects, if `false` only show 
     * deactivated (deleted, but not yet purged) Projects. If `undefined`, show all.
     */
    async getProjects( active, fields ) {
        var query = (active !== undefined ? { 'active':  1, 'account__active': 1 } : {}); //TODO: investigate
        if(fields !== undefined) query.fields = fields;
        try {
            let result = await getJSONResponse.call( this, `v1/project/`, query );
            return result;
        } catch ( error ) {
            throw ( error );
        }
    }
    
    /**
     * Returns an object containing a collection of all Projects that start with `name`
     * 
     * @param {String} name Name of Project, or prefix of Project names
     * @returns {Object} A collection of all Projects that start with `name`
     */
    async getProjectsByName( name ) {
        // PRIVATE_API
        try {
            let result = await getJSONResponse.call( this, `v1/project/`, (name !== undefined ? {name:name}: null) );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    /**
     * Returns an object containing data for the specified Project
     * 
     * @param {Number} projectId The `id` property of the desired Project
     * @returns {Object} JSON object containing data for one specified Project
     */
    async getProjectById( projectId, fields ) {
        try {
            let result = await getJSONResponse.call( this, `v1/project/${projectId}/`, (fields !== undefined ? {fields: fields} : null ));
            return result;
        } catch ( error ) {
            throw( error );
        }
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
     * @param {Number} projectId The `id` property of the desired Project
     * @param {String} [fields] comma-separated list of properties to return. (No spaces.) If unspecified, returns all properties.
     * @returns {Object} Object containing data for all Reviews in the specified Project
     */
    async getReviewsByProjectId( projectId, active = 1, fields ) {
        var query = { 
            'project__id': projectId 
        };
        if(fields !== undefined) query.fields = fields;
        if(active) query.active = active;
        try {
            let result = await getJSONResponse.call( this, `v1/review/`, query );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    /**
    * Returns an object containing a list of all Reviews that start with <name>
    * 
    * @param {String} name Name of Reviews, or prefix of Review names
    * @param {String} [fields] comma-separated list of properties to return. (No spaces.) If unspecified, returns all properties.
    * @returns {Object} JSON object containing data for all Reviews starting with the specified name
    */  
    async getReviewByName( name, fields ) {
        var query = { 
            'name__istartswith' : name 
        }; 
        if( fields !== undefined ) query.fields = fields;
        try {
            let result = await getJSONResponse.call( this, 'v1/review/', query ); 
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
       
    /**
     * Returns an object containing data for the specified Review.
     * 
     * @param {Number} reviewId The `id` property of the desired Review
     * @returns {Object} Object containing data for specified Review.
     */
    async getReviewById( reviewId ) {
        try {
            let result = await getJSONResponse.call( this, `v1/review/${reviewId}/` );
            return result;
        } catch ( error ) {
            throw( error );
        }
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
     * 
     * `reviews__name = NAME TO SEARCH`
     * 
     * Using the "`__`" syntax you can even search for items relationally, like
     * 
     * `reviews__project__name = $PROJECT NAME TO SEARCH`
     * 
     * To speed up a query you can also pass in a limit e.g `limit:10`; the `meta` object in 
     * the returned object will provide paths for getting the next (or previous) "page" of results.
     * 
     * NOTE: Please make sure to include the `active:1` query if you only want active media. Deleted files are 
     * currently only deactivated and kept for a certain period of time before they are "purged" from the system.
     * 
     * ```
     * results = await ss.getMedia({'reviews__project__name':'My Project', 'limit': 1, 'active': 1})
     * // Returns a JSON object with the first active Review within the "My Project" Project
     * ```
     * 
     * @see {@link https://docs.djangoproject.com/en/1.11/topics/db/queries/|Django search definition} to query
     * items by foreign keys using Django syntax.
     * 
     * @param {object} searchCriteria 
     * @returns {Object}
     */
    async getMedia( query ){
       
        try {
            let result = await getJSONResponse.call( this, 'v1/item/', query );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    async getMediaByReviewId( reviewId, active = 1 ) {
        var query = { 
            'reviews__id' : reviewId 
        }; 
        query.active = active;
        try{ 
            let result = await getJSONResponse.call( this, 'v1/item/', query );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    /**
     * Get sketches and comments for an item. Annotations have a revision ID which signifies a "set of notes".
     * When querying an item or calling `getRevisions(itemId)` you'll get the available revisions for this item. 
     * 
     * @param {Number} itemId `id` of the media item you are querying.
     * @param {String} [type=comment|sketch] "comment" or "sketch" to return just one or the other. If unspecified, returns both.
     * @param {Number} [limit=10] Limit search results.
     * @param {Number} [offset=0] For paging of limited search results. 
     * @param {Number} [revisionId] Optional `revisionId` to narrow down the results
     * @param {Object} [params] search params, including `creator` (ID) and date range: `created__gt` (e.g. 2021-01-01) and `created__lt`
     * @returns {Object} JSON object with search results
     */
    async getAnnotations(itemId, type, limit = 10, offset = 0, revisionId, query = {}, fields) {

        query.item__id = itemId;
        if( type !== undefined ) query.type = type;
        query.limit = limit;
        query.offset = offset;
        if( revisionId !== undefined ) query.revisionId = revisionId;
        //if( fields !== undefined ) query.fields = fields; // Queries with fields are currently not working

        try {
            let result = await getJSONResponse.call( this, 'v1/frame/', query );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    /**
     * Get annotations for an item with sketches composited over ("baked into") the frames behind them. 
     * 
     * @param {Number} reviewId `id` of the review where the media item you are querying appears.
     * @param {Number} itemId `id` of the media item you are querying.
     * @param {Boolean} [with_tracing_paper=false] Include tracing paper.
     * @param {Boolean} [return_as_base64=false] Return images as base64-encoded strings. If false, returns S3 URLs.
     * @returns {Array} Array of either signed S3 URLs or base64-encoded strings
     */
    async getFlattenedAnnotations( reviewId, itemId, with_tracing_paper = false, return_as_base64 = false ) {
        let query = {
            include_data: 1,
            tracingpaper: with_tracing_paper,
            base64: return_as_base64,
            async: 0
        };
        try {
            let result = await getJSONResponse.call( this, `downloads/flattenedSketches/${reviewId}/${itemId}/`, query, 'POST');
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
    * Returns an object containing a list of users in this account starting with `name`.
    * 
    * @param {String} name Starting characters in the name of user(s)
    * @returns {Object} JSON object containing matching users
    */   
    async getUsersByName( name ) {
        var query = {
            'name__istartswith': name
        };
        try {
            let result = await getJSONResponse.call( this, 'v1/simpleperson/', query );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
     * Returns the id of the first Revision associated with a given media item.
     * 
     * @param {Number} itemId `id` property of media item
     * @returns {Number} ID number of the first revision in an item's `revisions` array.
     */
    async getRevision( itemId ) {
        let query = {
            fields: 'revisions'
        }
        try {
            let result = await getJSONResponse.call( this, `v1/item/${itemId}`, query );
            return result.revisions[0].id; //TODO: Get all revisions
        } catch ( error ) {
            throw( error );
        }
    }
    
    /**
     * Returns an array of Revisions associated with a given media item.
     * 
     * @param {Number} itemId `id` property of media item
     * @param {Number} [limit] Limit returned results.  If unspecified, limits to 10.
     * @returns {Object} JSON object containing list of Revisions in the Account. If 
     * `itemId` is specified, returns a JSON object with a collection of Revisions associated 
     * with the specified media item.
     */
    async getRevisions( itemId, limit = 10 ) {
        let query = {
            fields: 'revisions',
            limit: limit
        }
        try {
        let result = await getJSONResponse.call( this, `v1/item/${itemId}`, query );
            return result; 
        } catch ( error ) {
            throw( error );
        }
    }
        
    /**
     * Returns an object containing a list of users for a specified Project.
     * 
     * @param {Number} projectId `id` property of desired Project
     * @returns {Object} JSON object containing users in the specified Project
     */  
    async getUsersByProjectId( projectId ) {
        var query = {
            'projects__id': projectId
        };
        try {
            let result = await getJSONResponse.call( this, 'v1/simpleperson/', query);
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
        
    /**
     * Returns an object containing the specified User's data.
     * 
     * @param {Number} userId `id` property of desired User
     * @returns {Object} JSON object containing User's data
     */
    async getUserById( userId ) {
        try {
            let result = getJSONResponse.call( this, `v1/person/${userId}/`);
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
     * Returns an object containing the current User's data
     * 
     * @returns {Object} JSON object containing User's data
     */ 
    async getCurrentUser() {
        // PRIVATE_API
        try {
            let result = await getJSONResponse.call( this, 'v1/simpleperson/currentUser/');
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    /* ADD/UPDATE (POST/PATCH) */
        
    /** 
    * Add a Project to your account. Please make sure to pass the accountId which you can retrieve by calling `getAccounts()`).
    * HTTP 403 errors indicate either an authorization problem with your username and API Key, or that your
    * plan has reached the maximum number of Projects allowed, and a Project must be deleted or your plan upgraded.
    *
    * @param {Number} accountId id of the account to connect with
    * @param {String} name Name for the new Project
    * @param {String} [description] Description of the new Project
    * @param {Object} data Dictionary with additional information e.g. is_public. Find out more about available fields at /api/v1/project/schema/.
    * @returns {Object} data object for the new Project
    */
    async addProject( accountId, name, description = '', data = {} ) {
        /* 
        Add a project to your account. Please make sure to pass the accountId which you can query using the getAccounts command.
        
        :param accountId: Number - id of the account to connect with
        :param name: String
        :param description: String
        :param data: Dict with additional information e.g is_public. Find out more about available fields at /api/v1/project/schema/.
        :return: 
        */

        if( accountId === undefined ) {
            throw({err: "AccountId is undefined"})
        }
       var projectData = {
           'name': name,
           'description': description,
           'account': `/api/v1/account/${accountId}/`,
        };
        var postData = Object.assign( data, projectData); 
        try {
            let result = await getJSONResponse.call( this, 'v1/project/', postData, 'POST' );
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
     * Add a new Review to the specified Project.
     * 
     * @param {Number} projectId id of the Project the Review will be added to
     * @param {String} name Name for the new Review
     * @param {String} [description] Description of the new Review
     * @param {Object} [data] Other data to override defaults, such as `creator`
     * @returns {Object} Data object for the new Review
     */
    async addReview( projectId, name, description = '', data = {} ) {
        if( projectId === undefined ) {
            throw({err: "ProjectId is undefined"})
        }
        var reviewData = {
            'name': name,
            'description': description,
            'project': `/api/v1/project/${projectId}/`,
         };
         var postData = Object.assign( data, reviewData );
         try{
             let result = await getJSONResponse.call( this, 'v1/review/', postData, 'POST' );
             return result;
        } catch ( error ) {
            throw( error );
        }
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
     * @param {String} artist_name The name of the creator you want associated with this media file
     * @param {Boolean} [noConvertFlag] Skips re-encoding step after upload. Use if the item is already in a browser-friendly format, such as a 3MBit/sec .MP4 at 1280x720.  
     * @param {Number} [itemParentId] Set when you want to add a new version of an existing item. 
     * @returns {Object} JSON object with description of new Item.
    */
    async addMedia( reviewId, filepath, artist_name = '', noConvertFlag = false, itemParentId = false ) {
       
        throw ({err: "API not yet implemented"})
        let query = {
            noConvertFlag: (noConvertFlag ? 1 : 0),
            itemParentId: (itemParentId ? itemParentId : false),
        }

        if( itemParentId !== undefined ) query.itemParentId = itemParentId;

        let uploadURL = `${this.HOST}/items/uploadToReview/${reviewId}/${serialize(query)}`;
        console.log(`File URL: ${uploadURL}`);
        
        try {
           let r = await fetch('/upload/image', 
             {method: "POST", body: formData, signal: ctrl.signal}); 
           console.log('HTTP response code:',r.status); 
        } catch(e) {
           console.log('Huston we have problem...:', e);
        }

        let files = {};
        try {
            files.reviewFile = await fetch(filepath) // TODO: finish this           
        } catch (error) {
            throw( error )
        }
        try {
            var res = await getJSONResponse(uploadURL, query, 'POST') // TODO: finish this
            return res;
        } catch (error) {
            throw( error );
        }
        //TODO: error check
    }

    /**
     * Give Project access to a group of Users.
     * @deprecated User `addUsersToProject` instead.
     * 
     * @param {Object} projectId - `id` property of the Project that the Users will be added to
     * @param {Object[]} users - array of object literals 
     * @param {String} users.email
     * @param {String} users.permission - such as `admin`, `member`, `restricted_member`, `reviewer`, `viewer`
     * @returns {Object} - Key `addedUsers` containing an array of usernames for added users
     */
    async addUsers( projectId, users ) {
        if (!Array.isArray(users) ) {
            console.error(`addUsers(): Invalid data for users; must be array of objects with user properties`);
            throw({status: 400, statusText: 'invalid user data format'})
        }

        if (projectId == undefined ) {
            console.error(`addUsers(): projectId is undefined.`);
            throw({status: 400, statusText: 'projectId is undefined'})
        }

        try {
            let result = await getJSONResponse.call( this, `v1/project/${projectId}/addUsers/`, { users: users }, 'POST');
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
     * Give Project access to a group of Users.
     * 
     * @param {Object} projectId - `id` property of the Project that the Users will be added to
     * @param {Object[]} users - array of object literals 
     * @param {String} users.email
     * @param {String} users.permission - such as `admin`, `member`, `restricted_member`, `reviewer`, `viewer`
     * @param {String} [note] Text to be included in the invitation email
     * @returns {Object} - Key `addedUsers` containing an array of usernames for added users
     */
    async addUserstoProject( projectId, users, note = '' ) {
        if (!Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error(`addUsers(): Invalid data for users; must be array of objects with user properties`);
            throw({status: 400, statusText: 'invalid user data format'})
        }

        if (projectId == undefined ) {
            console.error(`addUsers(): projectId is undefined.`);
            throw({status: 400, statusText: 'projectId is undefined'})
        }

        let query = {
            "which": "project",
            "entity_id": projectId,
            "note": note,
            "users": users
        }

        try {
            let result = await getJSONResponse.call( this, `v2/add-users/`, query, 'POST');
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
 
    /**
     * Remove Project access from a group of Users.
     * 
     * @param {Object} projectId `id` property of the Project that the Users will be removed from
     * @param {Object[]} users array of object literals with properties `email` and `permission`. Permission values are `admin`, `member`, `restricted_member`, `reviewer`, `viewer`
     * @returns {Object} Object
     */
     async removeUsersFromProject( projectId, users ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please remove users by list with user items e.g users=[{'email':'test@test.de'}]")
            throw(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        }
        
        query = {
            "which": "project",
            "entity_id": projectId,
            "users": users
        }
        try {
            let result = await getJSONResponse.call( this, `v2/add-users/`, query, 'POST');
            return result;
        } catch (error) {
            throw( error );
        }
    }

    /**
     * Give Workspace access to a group of Users.
     * 
     * @param {Object} accountId `id` property of the account that the Users will be added to. Use `getAccounts()` to retrieve the ID.
     * @param {Object[]} users array of object literals with properties `email` and `permission`. Permission values are admin, member, restricted_member, reviewer, viewer
     * @param {String} note Text to be sent in an invitation email
     * @returns {Object} Key `'addedUsers'` containing an array of usernames for added users
     */
    async addUsersToWorkspace( accountId, users, note='' ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please add users by list with user items e.g users=[{'email':'test@test.de','permission':'viewer'}]")
            throw(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        } 
        
        query = {
            "which": "account",
            "entity_id": accountId,
            "users": users
        }
        try {
            let result = await getJSONResponse.call( this, `v2/add-users/`, query, 'POST');
            return result;
        } catch (error) {
            throw( error );
        }
    }
 
    /**
     * Remove Workspace access from a group of Users.
     * 
     * @param {Object} accountId `id` property of the account that the Users will be removed from
     * @param {Object[]} users array of object literals with properties `email` or `id` (the user's `creator_id`)
     * @returns {Object} Object
     */
    async removeUsersFromWorkspace( accountId, users ) {

        if( !Array.isArray(users) || ( ! 'email' in users ) ( ! 'permission' in users ) ) {
            console.error("Please remove users by list with user items e.g users=[{'email':'test@test.de'}]")
            throw(new Error(`Error 400: Users list should be an array of object literals.   Instead got ${JSON.stringify(users, null, '\t')}`))
        } 
        
        query = {
            "which": "account",
            "entity_id": accountId,
            "users": JSON.stringify(users)
        }
        
        try {
            let result = await getJSONResponse.call( this, `v2/add-users/`, query, 'POST');
            return result;
        } catch (error) {
            throw( error );
        }
    }

    /**
     * Create a media item record and connect it to a review. This should be used in case you want to add items with externally hosted
     * media by adding `external_url` and `external_thumbnail_url` properties to the `additionalData` object literal, e.g
     * @example
     * ```
     * additionalData = {
     *    external_url: http://52.24.98.51/wp-content/uploads/2017/03/rain.jpg
     *    external_thumbnail_url: http://52.24.98.51/wp-content/uploads/2017/03/rain.jpg
     * }
     *```
     * 
     * @todo Finish implementing this function
     *
     * @param {Number} reviewId `id` of the Review that will contain the media item (required)
     * @param {String} name Friendly name of the item (required)
     * @param {Number} fps framerate in frames per second to two decimal places (required). 
     * @param {Object} additionalData Valid values include `width`, `height`, `duration` (in seconds), `description`, `size` in bytes, `type` (`image` or `video`)
     * @param {Number} additionalData.width - in pixels
     * @param {Number} additionalData.height - in pixels
     * @param {Number} additionalData.duration - in seconds
     * @param {String} additionalData.description - The item's description
     * @param {Number} additionalData.size - The item's size in bytes
     * @param {Number} additionalData.type - The item's type (`image` or `video`)
     * @returns {Object} Object with description of the new Item.
     * 
     * For a complete list of available fields to set, please retrieve https://www.syncsketch.com/api/v1/item/schema/
    */    
    async addItem( reviewId, name, fps, additionalData ) {
        var postData = {
            "reviews": [`/api/v1/review/${reviewId}/`],
            "status": "done",
            "fps": fps,
            "name": name,
        }

        Object.assign(postData, additionalData);

        try {
            let result = await getJSONResponse.call( this, 'v1/item/', postData, 'POST');
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
    * This allows a media item's property values to be updated.
    * 
    * @param {Number} itemId `id` property of the media item you want to update
    * @param {Object} data JSON object with updated media item properties and values
    * @returns {Object} Item data object with updated media item references array
    */
    async updateItem( itemId, data ) {
        if(typeof(data) != Object) {
            console.log( "Invalid format for 'data'. Please pass an object literal.")
            throw({err: "Invalid Format"})
        }
        try {
            let result = await getJSONResponse.call(this, `item/${itemId}/`, data, 'PATCH')
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
    * This allows a media item to be deleted.  It will initially be soft-deleted (marked as inactive), but will not be actually deleted for some time.
    * 
    * @param {Number} itemId `id` property of the media item you want to delete
    */
    async deleteItem( itemId ) {
        try {
            let result = await getJSONResponse.call(this, `item/${itemId}/`,{active:0}, 'PATCH')
            return result;
        } catch ( error ) {
            throw( error );
        }
    }

    /**
    * This allows several media items to be marked for deletion simultaneously.
    * 
    * @todo Verify implementation. Error-check.
    * 
    * @param {Number[]} itemList Array of `id` properties of the media items you want to delete
    * @returns {Object} Item data object with updated media item references array
    */
    async bulkDeleteItems( itemList ) {
        try {
            let result = await getJSONResponse.call(this, `item/${itemId}/`, itemList, 'POST')
            return result;
        } catch ( error ) {
            throw( error );
        }
    }
    
    /**
     * Move a group of Items from one Review to another.  
     * 
     * @param {Object} reviewId `id` property of target review
     * @param {Object[]} itemData Array of object literals with properties of items to be moved
     * @param {Number} itemData.id `id` of item to be moved
     * @param {Number} itemData.reviewId Current `reviewId` properties of item to be moved
     * @returns {Boolean} `true` if successful, otherwise `false`
     */
     async moveItems( reviewId, itemData ) {
        var data = {
            "new_review_id": reviewId,
            "item_data": itemData
        }

        Object.assign(postData, additionalData);
        try {
            let result = await getJSONResponse.call( this, 'v2/move_review_items/', data, 'POST');
            return result;
        } catch (error) {
            throw( error );
        }
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
     * @param {Number} reviewId
     * @param {Number} itemId
     * @returns {File} Zip file with XML and sketches as PNG files, for review inside Maya
     */
    async getGreasePencilOverlays( reviewId, itemId ) {
    
       url = `${this.HOST}/manage/downloadGreasePencilFile/${reviewId}/${itemId}/?`
       try {
           let result = await getJSONResponse( { url: url, contentType: 'application/json' }, serialize(self.apiParams ));
            if(result.err) throw( result.err );
            
            try {
                let sketch = await getJSONResponse( { url: res['s3Path'], contentType: 'application/json' }, '')
                return sketch;
            } catch ( error ) {
                throw( error );
            }
        } catch ( error ) {
            throw( error );
        }
    }

} // SyncSketchAPI

// experimental API WIP.  Ignore for now.
function reviews(options, done = null) {
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