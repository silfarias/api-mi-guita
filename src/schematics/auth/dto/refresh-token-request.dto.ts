import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDto {
    @ApiProperty({
        description: 'Refresh token recibido en login o en la última renovación',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsNotEmpty()
    @IsString()
    refresh_token: string;
}
