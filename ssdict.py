class ssdict:
    def __init__(self, ss, param, collectiontype):
        factory = {
            'projects': self.getProjects,
            'reviews': self.getReviews,
            'items': self.getItems,
            'comments': self.getComments,
        }
        func = factory[collectiontype]
        self.collection = func(ss, param)

    def getProjects(self, ss, accountid):
        self.intro = '\nProjects in this account:\n'
        return ss.getProjects(accountid)['objects']   
    
    def getReviews(self, ss, projectid):
        self.intro = '\nReviews in the Project Under Test:\n'
        return ss.get_reviews_by_project_id(projectid)['objects']
    
    def getItems(self, ss, reviewid):
        self.intro = '\nItems in the Review Under Test:\n'
        return ss.get_media_by_review_id(reviewid)['objects']
    
    def getComments(self, ss, itemid):
        self.intro = '\nComments in the Item Under Test:\n'
        return ss.get_annotations(itemid)['objects']

    def getCatalogue(self):
        catalogue = self.intro
        for item in self.collection:
            catalogue +='\t'
            for prop in ['id','name','text']:
                if prop in item:
                    catalogue += str(item[prop]) + ' '
            catalogue += '\n'
        catalogue += '\n'
        return catalogue