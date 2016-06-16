crfMap Directive
=====================

This project is built using:

* AngularJS
* ArcGIS
* jQuery
* OUI/UITK

### SETUP

Add the following to your header:

```
<script src="https://rawgit.com/savtwo/esri-map/test/map.js"></script>
<script src="https://js.arcgis.com/3.16/"></script>

<link rel="stylesheet" href="https://rawgit.com/savtwo/esri-map/test/map.css">
<link rel="stylesheet" href="https://js.arcgis.com/3.16/esri/css/esri.css">
```

### Including in HTML

`<crf-map member="" crf-provider="" callback=""></crf-map>`

### Directive Properties

#### member
> **Type:** Object

> ***Example Structure:*** 
```
{
  transactionId: 999,
  needs: [
    {
      clientId: 98765,
      firstName: "Michael",
      lastName: "Doe",
      addresses: [
        {
          addressId: 1,
          name: "Home",
          address: "2100 Bloomington Ave S, Minneapolis, MN 55404",
          ADR_LN_1_TXT: "2100 Bloomington Ave S",
          ADR_LN_2_TXT: null,
          CTY_NM: "Minneapolis",
          ST: "MN",
          ZIP: "55404",
          ZIP_EXT: null
        },
        {
          addressId: 2,
          name: "Work",
          address: "13625 Technology Dr, Eden Prairie, MN 55346",
          ADR_LN_1_TXT: "13625 Technology Dr",
          ADR_LN_2_TXT: null,
          CTY_NM: "Eden Prairie",
          ST: "MN",
          ZIP: "55346",
          ZIP_EXT: null
        }
      ],
      details: [
        {
          detailId: "000009",
          program: "Medical",
          filter: "Medical",
          subsidized: "100%",
          providerId: null, //(optional - Added For View Map Purpose.)
          allowUpdate: true //(Added  for updating provider details)              
        }
      ]
    }
  ]
}

```
#### crf-provider
> Watcher for clicking on the provider name and showing in the map directive

```

$scope.crfProvider = member.provider;

```

#### callback
> Callback function that returns the member and provider data object from the directive

> ***Example Structure:*** 
```
{
  "transactionId": 999,
  "needs": [
    {
      "clientId": 98765,
      "firstName": "Michael",
      "lastName": "Doe",
      "addresses": [
        {
          "addressId": 1,
          "name": "Home",
          "address": "2100 Bloomington Ave S, Minneapolis, MN 55404",
          "ADR_LN_1_TXT": "2100 Bloomington Ave S",
          "ADR_LN_2_TXT": null,
          "CTY_NM": "Minneapolis",
          "ST": "MN",
          "ZIP": "55404",
          "ZIP_EXT": null
        },
        {
          "addressId": 2,
          "name": "Work",
          "address": "13625 Technology Dr, Eden Prairie, MN 55346",
          "ADR_LN_1_TXT": "13625 Technology Dr",
          "ADR_LN_2_TXT": null,
          "CTY_NM": "Eden Prairie",
          "ST": "MN",
          "ZIP": "55346",
          "ZIP_EXT": null
        }
      ],
      "details": [
        {
          "detailId": "000009",
          "program": "Medical",
          "provider": {
            "id": 1230,
            "name": "Gold Star Taxi",
            "address": "5111 3rd Ave St NE,Minneapolis,MN,55421",
            "ADR_ID": "ADR_ID_TEST",
            "ADR_LN_1_TXT": "5111 3rd Ave St NE",
            "ADR_LN_2_TXT": "ADR_LN_2_TXT_TEST",
            "CTY_NM": "Minneapolis",
            "ST": "MN",
            "ZIP": "55421",
            "ZIP_EXT": "ZIP_EXT",
            "FGN_PRVC_NM": "FGN_PRVC_NM",
            "FGN_PST_CD": "FGN_PST_CD",
            "CNTY": "CNTRY",
            "ADR_TYP_CD": "ADR_TYP_CD",
            "IN_JAIL_OR_INST_BY_THS_ST": "IN_JAIL_OR_INST_BY_THS_ST",
            "ADR_SPEC_CD": "ADR_SPEC_CD",
            "JAIL_OR_INST_ADR_FLG": "JAIL_OR_INST_ADR_FLG",
            "phone": "763-549-9999",
            "website": "http://www.goldstartaxiservice.com/"
          }
        }
      ]
    }
  ]
}

```