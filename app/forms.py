from flask_wtf import FlaskForm
from wtforms import IntegerField, StringField
from wtforms.validators import DataRequired, Length, NumberRange, ValidationError


class ShelfForm(FlaskForm):
    name = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=120, message="error.length")],
    )
    max_capacity = IntegerField(
        validators=[DataRequired(message="error.required"), NumberRange(min=0, max=100000, message="error.non_negative")],
    )


class InventoryItemForm(FlaskForm):
    stock_count = IntegerField(
        validators=[DataRequired(message="error.required"), NumberRange(min=0, max=1000000, message="error.non_negative")],
    )
    shelf_count = IntegerField(
        validators=[DataRequired(message="error.required"), NumberRange(min=0, max=1000000, message="error.non_negative")],
    )

    def validate_shelf_count(self, field: IntegerField) -> None:
        stock = self.stock_count.data
        if stock is not None and field.data is not None and field.data > stock:
            raise ValidationError("error.shelf_le_stock")


class InventoryItemCreateForm(InventoryItemForm):
    store_id = StringField(validators=[DataRequired(message="error.required"), Length(min=1, max=80, message="error.length")])
    shelf_id = StringField(validators=[DataRequired(message="error.required"), Length(min=1, max=80, message="error.length")])
    product_id = StringField(validators=[DataRequired(message="error.required"), Length(min=1, max=80, message="error.length")])


class DeleteForm(FlaskForm):
    pass


class StoreForm(FlaskForm):
    name = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=120, message="error.length")],
    )
    address = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=240, message="error.length")],
    )
    image = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=400, message="error.length")],
    )
    latitude = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=32, message="error.length")],
    )
    longitude = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=32, message="error.length")],
    )


class ProductForm(FlaskForm):
    name = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=120, message="error.length")],
    )
    size = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=24, message="error.length")],
    )
    price = IntegerField(
        validators=[DataRequired(message="error.required"), NumberRange(min=0, max=100000000, message="error.non_negative")],
    )
    image = StringField(
        validators=[DataRequired(message="error.required"), Length(min=1, max=400, message="error.length")],
    )