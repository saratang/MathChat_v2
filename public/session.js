window.onload = function() {
	//Checks if user is valid
	$('#enter').click(function(e) {
		alert('Pressed enter!');
		if ($('#name').val() == '') {
			alert('Name cannot be empty!');
		} else {
			var name = $('#name').val();
			$('#chatroom').show();
		}
	});
}