'use strict';

angular.module('quiverCmsApp')
  .controller('WordsCtrl', function ($scope, limit, wordsRef, hashtagsRef, moment, NotificationService, Slug, $timeout, AdminService) {
    /*
     * Words
    */
    $scope.limit = limit;
    $scope.words = wordsRef.$asArray();

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);

      wordsRef = AdminService.getWords({orderByPriority: true, limitToFirst: $scope.limit});
      wordsRef.$asArray().$loaded().then(function (words) {
        $scope.words = words;
      });

    };

    $scope.setQuery = function (field, query) {
      var value = query[field], 
        options = {orderByChild: field, startAt: value};

      $scope.limit = limit;

      if (!value || !value.length) {
        options = {orderByPriority: true, limitToFirst: $scope.limit}; 
      }

      wordsRef = AdminService.getWords(options);
      wordsRef.$asArray().$loaded().then(function (words) {
        $scope.words = words;
      });
      
      
    };

    $scope.removeWord = function (word) {
      var title = word.title;

      $scope.words.$remove(word).then(function () {
        NotificationService.success('Deleted', 'Bye bye ' + title + '!');
      }, function (error) {
        NotificationService.error('Delete Failed', 'Something is up!');
      });
    };

    $scope.createWord = function (title) {
      var author = $scope.user.public;

      _.defaults(author, {
        id: $scope.user.$id,
        name: $scope.currentUser.uid,
        email: $scope.currentUser.email
      });

      $scope.words.$add({
        title: title,
        slug: Slug.slugify(title),
        type: 'page',
        created: moment().format(),
        author: author
      }).then(function (ref) {
        ref.setPriority(100000);
        delete $scope.newWordTitle;
        NotificationService.success('Created', 'Hi there ' + title + '.');
      });

    };

    $scope.unpublishWord = function (word) {
      delete word.published;
      word.edited = true;

    };

    $scope.saveWord = function (word) {
      delete word.edited;

      word.slug = Slug.slugify(word.slug);

      $scope.words.$save(word).then(function () {
        NotificationService.success('Saved', word.title);
      }, function (error) {
        NotificationService.error('Save Error', error);
      });

    };

    $scope.makeAuthor = function (word, user) {
      word.edited = true;
      word.author = user.public;
      word.author.id = parseInt(user.$id);
    };

    var authorAttributes = ['birthdate', 'email', 'gender', 'instagram', 'name', 'twitter', 'instagram', 'website'];
    $scope.isAuthor = function (author, user) {
      var i = authorAttributes.length;

      while (i--) {
        if (author[authorAttributes[i]] !== user[authorAttributes[i]]) {
          return false;
        }
      }
      return true;
    };

    /*
     * Hashtags
    */
    $scope.hashtags = hashtagsRef.$asArray();

    $scope.addHashtag = function (word, newHashtag) {
      $timeout(function () {
        var hashtag;

        if (!word.hashtags) {
          word.hashtags = [];
        }

        if (typeof newHashtag === 'string') {
          hashtag = newHashtag.replace(/(#|\s)/g, '');
          word.hashtags.push({
            key: Slug.slugify(hashtag),
            value: hashtag
          });
          $scope.words.$save(word);
        } else if (newHashtag && newHashtag.key) {
          word.hashtags.push(word.newHashtag);
          $scope.words.$save(word);
        }

      });



//      $scope.hashtags.$add({
//        name: hashtag,
//        slug: Slug.slugify(hashtag),
//        creator: $scope.currentUser.email
//      }).then(function () {
//          NotificationService.success('Hashtag Added');
//      });
    };

    $scope.removeHashtag = function (word, slug) {
      var i = word.hashtags.length

      while (i--) {
        if (word.hashtags[i].key === slug) {
          word.hashtags.splice(i, 1);
          return $scope.words.$save(word);
        }
      }

    };

    $scope.setPriority = function (key, priority) {
      AdminService.getWord(key).$ref().setPriority(priority);      
    };


  });
