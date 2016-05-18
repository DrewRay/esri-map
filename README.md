CRF Map Directive POC
=====================

This project is built using:

* AngularJS
* jquery
* ArcGIS

### SETUP

This project is dependent on AngularJS, jquery, and ArcGIS. Add the following to your header:

```
<link rel="stylesheet" href="https://js.arcgis.com/3.16/esri/css/esri.css">
<script src="https://js.arcgis.com/3.16/"></script>
<script src="https://rawgit.com/savtwo/esri-map/master/map.directive.js"></script>
```

### Including in HTML

`<crf-map member="" callback=""></crf-map>`

### Directive Properties

#### member
> **Type:** Object
> ***Example Structure:*** 
```
{
  transactionId: 123,
  needs: [
    {
      clientId: 12345,
      name: "Jane Doe",
      addresses: [
        {
          addressId: 1,
          name: "Home",
          street : "225 W College Ave",
          city: "St. Peter",
          state: "MN",
          zip: "56082",
          latitude: 44.318807, // geocoded by another service
          longitude: -93.963605, // geocoded by another service
        },
        {...} // if needed
      ],
      details: [
        {
          detailId: "000009",
          program: "TEST",
          filter: "TEST1",
          subsidized: "100%"
        }
      ]
    }
  ]
}
```

#### callback
> Callback function that returns the member and provider data object from the directive
> ***Example Structur:*** 
```
{
  transactionId: 123,
  needs: [
    {
      clientId: 12345,
      name: "Jane Doe",
      addresses: [{...}, {...}],
      details: [
        {
          detailId: "000009",
          program: "TEST",
          provider: [
            {
              id: 1234,
              name: "The Well Clinic",
              street: "1111 One Street",
              city: "Eden Prairie",
              state: "MN",
              zip: "55346",
              phone: "952-111-1111",
              website: "www.thewellclinic.com",
              geometry: {
                y: -122.38,
                x: 37.75
              }
            },
            {...}
          ]
        }
      ]
    }
  ]
}
```