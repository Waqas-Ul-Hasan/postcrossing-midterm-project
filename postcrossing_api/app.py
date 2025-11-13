from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.json_util import dumps
from datetime import datetime

app = Flask(__name__)
CORS(app)

try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['postcrossing_db']
    client.server_info() 
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

@app.route('/hello')
def hello_world():
    return "Hello, the server is working!"

@app.route('/api/users/register', methods=['POST'])
def register_user():

    try:
        data = request.get_json()
        new_user = {
            "username": data['username'],
            "email": data['email'],
            "country": data['country'],
            "date_joined": datetime.utcnow(),
            "sent_postcards": [],
            "received_postcards": []
        }
        result = db.users.insert_one(new_user)
        return jsonify({
            "message": "User registered!",
            "userId": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"message": "Error registering user", "error": str(e)}), 500

@app.route('/api/users/<userId>', methods=['GET'])
def get_user(userId):

    try:
        user = db.users.find_one({'_id': ObjectId(userId)})
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        return dumps(user), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({"message": "Error fetching user", "error": str(e)}), 500


@app.route('/api/postcards/request-address', methods=['POST'])
def request_address():

    try:
        data = request.get_json()
        sender_id = ObjectId(data['senderId'])

        pipeline = [
            {'$match': {'_id': {'$ne': sender_id}}},
            {'$addFields': {
                'due_score': {'$subtract': [{'$size': "$sent_postcards"}, {'$size': "$received_postcards"}]}
            }},
            {'$sort': {'due_score': -1}},
            {'$limit': 1}
        ]
        
        potential_recipients = list(db.users.aggregate(pipeline))

        if not potential_recipients:
            return jsonify({"message": "No eligible users available."}), 404

        recipient_user = potential_recipients[0]

        new_postcard = {
            "postcard_id": f"PC-{int(datetime.now().timestamp())}",
            "sender_id": sender_id,
            "receiver_id": recipient_user['_id'],
            "status": 'traveling',
            "sent_date": datetime.utcnow(),
            "received_date": None
        }
        
        postcard_result = db.postcards.insert_one(new_postcard)

        db.users.update_one(
            {'_id': sender_id},
            {'$push': {'sent_postcards': postcard_result.inserted_id}}
        )

        return jsonify({
            "message": "Address assigned to the most 'due' user!",
            "recipientInfo": {
                "userId": str(recipient_user['_id']),
                "username": recipient_user['username'],
                "country": recipient_user['country'],
                "address": "123 Fictional Street, Cityville, Country"
            },
            "postcardId": str(postcard_result.inserted_id)
        }), 200

    except Exception as e:
        return jsonify({"message": "Error requesting address", "error": str(e)}), 500

@app.route('/api/postcards/<postcardId>/received', methods=['PUT'])
def receive_postcard(postcardId):

    try:
        postcard_object_id = ObjectId(postcardId)
        postcard = db.postcards.find_one({'_id': postcard_object_id})
        
        if not postcard:
            return jsonify({"message": "Postcard not found."}), 404
        
        if postcard.get('status') == 'received':
            return jsonify({"message": "This postcard has already been registered."}), 400

        db.postcards.update_one(
            {'_id': postcard_object_id},
            {'$set': {'status': 'received', 'received_date': datetime.utcnow()}}
        )

        db.users.update_one(
            {'_id': postcard['receiver_id']},
            {'$push': {'received_postcards': postcard_object_id}}
        )

        return jsonify({"message": "Postcard successfully registered as received!"}), 200

    except Exception as e:
        return jsonify({"message": "Error registering postcard", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)