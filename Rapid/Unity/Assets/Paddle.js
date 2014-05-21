//
//  Created using [RapidGame](http://wizardfu.com/rapidgame).
//  See the `LICENSE` file for the license governing this code.
//  Developed by Nat Weiss.
//

public var ballPrefab : GameObject;
public var ballRigidbody : Rigidbody;
public var paddleSound : AudioClip;
public var wallBoundary : float = 130;
public var paddleSpeed : float = 300;
public var paddleBoundary : float = 22.0;
public var paddleGrace : float = 10.0;
public var ballSpeed : float = 6000;
public var attachedBall : GameObject = null;

private var originalPos : Vector3;

function Start() {
	originalPos = transform.position;
	spawnBall();
}

function Update () {
	if (Input.GetAxis("Horizontal") != 0 || Input.GetMouseButton(0)) {
		var mult = Input.GetAxis("Horizontal");
		var screenPos = Camera.main.WorldToScreenPoint(transform.position);
		if (!mult && Mathf.Abs(Input.mousePosition.x - screenPos.x) > paddleGrace) {
			mult = Input.mousePosition.x < screenPos.x ? -1 : 1;
		}
		transform.position = new Vector3(
			transform.position.x + mult * paddleSpeed * Time.deltaTime,
			originalPos.y,
			originalPos.z
		);

		if (transform.position.x < -wallBoundary + paddleBoundary) {
			transform.position = new Vector3(-wallBoundary + paddleBoundary, originalPos.y, originalPos.z);
		}
		else if (transform.position.x > wallBoundary - paddleBoundary) {
			transform.position = new Vector3(wallBoundary - paddleBoundary, originalPos.y, originalPos.z);
		}
	}
	
	if (attachedBall){
		ballRigidbody = attachedBall.rigidbody;
		ballRigidbody.position = transform.position + new Vector3(0,5.5,0);
		
		if (Input.GetButtonDown("Jump") || Input.GetMouseButtonDown(0)){
			ballRigidbody.isKinematic = false;
			ballRigidbody.AddForce(0, ballSpeed, 0);
			attachedBall = null;
		}
	}
}

function spawnBall(){
	attachedBall = Instantiate(
		ballPrefab,
		transform.position + new Vector3(0, 40, 0),
		Quaternion.identity
	) as GameObject;
}

function OnCollisionEnter(col:Collision){
	audio.PlayOneShot(paddleSound, 0.5);
	
	for (var contact:ContactPoint in col.contacts){
		if (contact.thisCollider == collider){
			// this is the paddle's contact point
			var ballangle:float = contact.point.x - transform.position.x;
			contact.otherCollider.rigidbody.AddForce(100 * ballangle, 0, 0);
		}
	}
}

