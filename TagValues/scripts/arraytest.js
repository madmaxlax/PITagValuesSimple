/// <reference path="C:\Apps\Dropbox\Dev\typings\jquery\jquery.d.ts" />
var resp = {};
var arr = null;
var newObject = null;
function doWork() {
    $.ajax({
        url: "https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/E0-d52kj1VR0aWEZdcjlIq7gMYo5dCc0WkSp_IyV2leVWwU1RDQSBBRiBTRVJWRVJcU1RDQS1BRlxNT05JVE9SSU5HXElOVEVSRkFDRVNcU0NBTjMwMDBcU0NBTjMwMDBCMTY/value?templateName=Interface",
        type: "GET",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            console.log(data);
            resp = data.Items;
            arr = reformatAttrArray(resp);
            newObject = otherReformat(resp);
            // newObject = Object.keys(resp).reduce(function (previous, current) {
            //     previous[current] = resp[current] * resp[current];
            //     return previous;
            // }, {});
        }
    });
}
doWork();
function reformatAttrArray(arr) {
    var result = {};
    for (var i = 0; i < arr.length; i++) {
        result[arr[i].Name] = arr[i];
    }
    return result;
}

function otherReformat(arr){
    var obj = arr.reduce(function(obj,item){
        obj[item.Name] = item; 
        return obj;
    },{});
    return obj;
}