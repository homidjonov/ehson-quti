Pin-kodni tekshirish va X-Api-Key olish (default 123456 pin kodi):
```curl -i -X POST \
   -H "Content-Type:application/x-www-form-urlencoded" \
   -d "pin=123456" \
 'https://api.mehrli.uz/v1/quti/verify'
```

Barcha qutilarni ro'yxatini olish:
```
curl -i -X GET \
 'https://api.mehrli.uz/v1/quti/list'
```

Quti uchun rasm yuklash:
```
curl -i -X POST \
   -H "Content-Type:multipart/form-data" \
   -H "X-Api-Key:O0sAIfGzT4FDuo4RIpJ10Fn6dmqKH-gZ" \
   -F "file=@\"./photo_2025-09-18_16-00-44.jpg\";type=image/jpeg;filename=\"photo_2025-09-18_16-00-44.jpg\"" \
 'https://api.mehrli.uz/v1/quti/upload'
 ```

Quti yaratish (number - quti raqami, location - joylashuv koordinatalari, images - quti/upload API da yuklangan rasmlar massivi):
```
curl -i -X POST \
   -H "Content-Type:application/json" \
   -H "X-Api-Key:O0sAIfGzT4FDuo4RIpJ10Fn6dmqKH-gZ" \
   -d \
'{
"number": 221211,
"location":"41.3247603;69.3235123",
"images": [
    {
        "name": "photo_2025-09-18_16-00-44.jpg",
        "type": "image/jpeg",
        "size": 144560,
        "base_url": "http://static.saxovat.lc/uploads",
        "path": "2/ycjfLS3WFknTzEn4CeiP9mdaoZOECtn7.jpg",
        "url": "http://static.saxovat.lc/uploads/2/ycjfLS3WFknTzEn4CeiP9mdaoZOECtn7.jpg",
        "delete_url": "/v1/quti/delete?path=2%2FycjfLS3WFknTzEn4CeiP9mdaoZOECtn7.jpg"
    }
]
}' \
 'https://api.mehrli.uz/v1/quti/create'
```

Qutini bo'shatish (id - quti identifikatori):
```
curl -i -X GET \
   -H "X-Api-Key:yaxcmeL6tmMEsOv9_ioUWo0piLzPGYn0" \
 'https://api.mehrli.uz/v1/quti/set-empty?id=68b9bf6d3da2942c6d7c10e1'
```

Qutini o'chirish (id - quti identifikatori):
```
curl -i -X GET \
   -H "X-Api-Key:yaxcmeL6tmMEsOv9_ioUWo0piLzPGYn0" \
 'https://api.mehrli.uz/v1/quti/remove?id=68b9bfc08165e978927d87df'
```