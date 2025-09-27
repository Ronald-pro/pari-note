import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    ParseIntPipe,
    Query
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Controller('locations')
export class LocationsController {
    constructor(private readonly locService: LocationsService) { }

    @Post()
    create(@Body() dto: CreateLocationDto) {
        console.log('DTO received:', dto);

        return this.locService.create(dto);
    }

    @Get()
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '10'
    ) {
        return this.locService.findAll(Number(page), Number(limit));
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.locService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLocationDto) {
        return this.locService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.locService.remove(id);
    }

    @Get('tree')
    getTree() {
        return this.locService.findTree();
    }



}
