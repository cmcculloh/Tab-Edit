DB = {
	  shortName: "favicons"
	, version: "1.3"
	, displayName: "Favicons"
	, maxSize: 65536
	, db: null
	, tables: [
		  {
			  name: 'favicons'
			, fields: [
				  { name: 'id' , structure: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT' }
				, { name: 'url' , structure: 'TEXT NOT NULL' }
				, { name: 'category' , structure: 'TEXT NOT NULL' }
			]
		}
		, {
			  name: 'preferences'
			, fields: [
				  { name: 'id' , structure: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT' }
				, { name: 'host' , structure: 'TEXT NOT NULL' }
				, { name: 'titleText' , structure: 'TEXT' }
				, { name: 'faviconId' , structure: 'INTEGER' }
			]
		}

	]
	, init: function () {
		this.db = openDatabase(this.shortName
								, this.version
								, this.displayName
								, this.maxSize);

		this.db.transaction(function(transaction){
			var sql, table, field;

			for(var tableNum = 0, numTables = DB.tables.length; tableNum < numTables; tableNum++){
				table = DB.tables[tableNum];
				sql = [
					'CREATE TABLE IF NOT EXISTS ',
					table.name,
					' ('
				];

				for(var fieldNum = 0, numFields = table.fields.length; fieldNum < numFields; fieldNum++){
					field = table.fields[fieldNum];

					//separate fields with commas
					if(fieldNum > 0){
						sql.push(', ');
					}

					sql.push(field.name, ' ');
					sql.push(field.structure);
				}

				sql.push(');');

				transaction.executeSql(sql.join(''));
			}
		});
	}
	, addFavicon: function(url, category) {
		this.db.transaction(function(tx){
			var sql, table, field;

			sql = [
				'INSERT INTO ',
				DB.tables[0].name,
				' (url, category) VALUES (?, ?)'
			];

			tx.executeSql(sql.join(''), [url, category]);
		});
	}
	, getFavicons: function(){
		this.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM favicons", [], function(tx, result) {
				if(result.rows.length > 0){
					TABDISPLAY.favicons = [];

					for (var i = 0; i < result.rows.length; ++i) {
						var row = result.rows.item(i);

						console.dir(row);

						TABDISPLAY.favicons.push(row);
					}

					TABDISPLAY.makeFaviconLinks();
				}else{
					TABDISPLAY.prePopulate();
				}
			}, function(tx, error) {
				return;
			});
		});
	}
	, removeFavicon: function(id){
		this.db.transaction(function(tx){
			tx.executeSql("DELETE FROM favicons WHERE id = ?", [id]);
		});

		DB.getFavicons();
	}
	, getPreferences: function () {
		chrome.tabs.getSelected(null, function(tab){
			if(tab != undefined){
				DB.db.transaction(function(tx){
					tx.executeSql("SELECT * FROM preferences WHERE host = ?"
									, [tab.url]
									, function(tx, result) {
						var row, faviconUrl;

						if(result.rows.length > 0){
							row = result.rows.item(0);

							if(row.titleText != undefined && row.titleText != null){
								chrome.tabs.executeScript(null, {code:'document.title = "' + row.titleText + '";'});
								TABDISPLAY.currentTitleText = row.titleText;
								document.getElementById("newTitle").value = row.titleText;
							}
							if(row.faviconId != undefined && row.faviconId != null){
								faviconUrl = TABDISPLAY.favicons[row.faviconId]["url"];
								chrome.tabs.executeScript(null, {file:'favicon.js'});
								chrome.tabs.executeScript(null, {code:'favicon.change("' + faviconUrl + '");'});
								TABDISPLAY.currentFaviconId = row.faviconId;

							}
						}else{

						}
					}, function(tx, error) {
						return;
					});
				});
			}
		});
	}
	, savePreferences: function(titleText, faviconId){
		chrome.tabs.getSelected(null, function(tab){
			if(tab != undefined){
				DB.db.transaction(function(tx){
					tx.executeSql("SELECT * FROM preferences WHERE host = ?", [tab.url], function(tx, result) {
						var row, sql, table, field;

						if(result.rows.length > 0){
							sql = [
								'UPDATE ',
								DB.tables[1].name,
								' SET titleText = ?, faviconId = ? WHERE host = ?'
							];
						}else{
							sql = [
								'INSERT INTO ',
								DB.tables[1].name,
								' (titleText, faviconId, host) VALUES (?, ?, ?)'
							];
						}

						tx.executeSql(sql.join(''), [titleText, faviconId, tab.url]);
					});
				});
			}else{
			}
		});
	}
}
